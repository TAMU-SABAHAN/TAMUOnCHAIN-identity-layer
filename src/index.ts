import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { SiweMessage } from "siwe";
import { ethers } from "ethers";
import { Pool } from "pg";
import { v4 as uuidv4 } from "uuid";
import Redis from "ioredis";

import { createReputationRouter } from "./reputation";
import { createRateLimitFactory } from "./rateLimit";
import { ENSResponses } from "./ensResponses";

dotenv.config();

const PORT = Number(process.env.PORT || 4000);
const RPC_URL = process.env.RPC_URL || "";
const ORIGIN = process.env.ORIGIN || "http://localhost:3000";
const NONCE_EXPIRY_MIN = Number(process.env.NONCE_TTL_MIN || 5);
const REQUIRE_REVERSE_ENS = (process.env.REQUIRE_REVERSE_ENS || "false").toLowerCase() === "true";
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";

if (!RPC_URL) {
  console.error("Missing RPC_URL in environment");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL in environment");
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);

const app = express();
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for frontend
}));
app.use(cors({ origin: ORIGIN }));
app.use(express.json());
app.use(express.static("public")); // Serve frontend from public directory

/**
 * Rate limiting (Phase 3A)
 * - Enabled via RATE_LIMIT_ENABLED env var
 * - If enabled, initializes Redis and rate limiter factory and produces rlMiddleware
 * - Middleware is fail-open: if limiter infra fails, requests are allowed and error is logged
 */
const RATE_LIMIT_ENABLED = (process.env.RATE_LIMIT_ENABLED || "false").toLowerCase() === "true";
let rlMiddleware: express.RequestHandler = (_req, _res, next) => next();

if (RATE_LIMIT_ENABLED) {
  const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";
  try {
    const redisClient = new Redis(REDIS_URL);
    const rlFactory = createRateLimitFactory(pool, redisClient, {
      cacheTtlSec: Number(process.env.RATE_LIMIT_CACHE_TTL_SEC || 60)
    });
    rlMiddleware = rlFactory();
    console.log("Rate limiting ENABLED (Phase 3A). REDIS_URL=", REDIS_URL);
  } catch (e) {
    console.error("Failed to initialize rate limiter, continuing without rate limiting:", e);
    rlMiddleware = (_req, _res, next) => next();
  }
} else {
  console.log("Rate limiting DISABLED");
}

/**
 * GET /api/nonce
 * - returns a single-use nonce stored in DB with TTL
 * - protected by rlMiddleware when enabled
 */
app.get("/api/nonce", rlMiddleware, async (req, res) => {
  try {
    const nonce = uuidv4();
    const expires_at = new Date(Date.now() + NONCE_EXPIRY_MIN * 60 * 1000);
    await pool.query("INSERT INTO nonces (nonce, expires_at) VALUES ($1, $2)", [nonce, expires_at]);
    res.json({ nonce, expiresAt: expires_at.toISOString() });
  } catch (err: any) {
    console.error("GET /api/nonce error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/ens/info
 * - Returns ENS information and status
 * - Protected by rlMiddleware when enabled
 */
app.get("/api/ens/info", rlMiddleware, async (req, res) => {
  try {
    const { ens, address } = req.query;
    
    if (ens) {
      const resolved = await provider.resolveName(ens as string);
      if (resolved) {
        return res.json(ENSResponses.ensResolved(ens as string, resolved));
      } else {
        return res.status(404).json(ENSResponses.ensNotResolved(ens as string));
      }
    } else if (address) {
      const reverse = await provider.lookupAddress(address as string);
      if (reverse) {
        return res.json(ENSResponses.reverseEnsFound(address as string, reverse));
      } else {
        return res.status(404).json(ENSResponses.reverseEnsMissing(address as string));
      }
    } else {
      return res.json(ENSResponses.ensInfo());
    }
  } catch (err: any) {
    console.error("GET /api/ens/info error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/verify
 * - Body: { message, signature, referralCode, ens? }
 * - Verifies SIWE (EIP-4361), checks nonce, optional ENS forward/reverse verification,
 *   stores referral binding in referrals table, deletes nonce (single-use).
 * - Protected by rlMiddleware when enabled.
 */
app.post("/api/verify", rlMiddleware, async (req, res) => {
  try {
    const { message, signature, referralCode, ens } = req.body;
    if (!message || !signature || !referralCode) {
      return res.status(400).json({ error: "Missing required fields: message, signature, referralCode" });
    }

    // Parse & validate SIWE message (signature verification included)
    const siweMessage = new SiweMessage(message);
    const fields = await siweMessage.validate(signature);

    // Ensure the SIWE message was intended for this origin (optional enforcement)
    if (siweMessage.uri && siweMessage.uri !== ORIGIN) {
      return res.status(400).json({ error: `SIWE message uri does not match server ORIGIN (${ORIGIN})` });
    }

    // Check nonce exists & not expired
    const nonceRow = await pool.query("SELECT * FROM nonces WHERE nonce = $1", [fields.nonce]);
    if (nonceRow.rowCount === 0) {
      return res.status(400).json({ error: "Invalid or missing nonce" });
    }
    const now = new Date();
    const expiresAt = new Date(nonceRow.rows[0].expires_at);
    if (now > expiresAt) {
      return res.status(400).json({ error: "Nonce expired" });
    }

    const recoveredAddress = fields.address.toLowerCase();

    // Optional ENS forward resolution
    if (ens) {
      const resolved = await provider.resolveName(ens);
      if (!resolved) {
        return res.status(400).json(ENSResponses.ensNotResolved(ens));
      }
      if (resolved.toLowerCase() !== recoveredAddress) {
        return res.status(400).json(ENSResponses.ensMismatch(ens, recoveredAddress, resolved.toLowerCase()));
      }
    }

    // Optional reverse ENS verification (configurable)
    if (REQUIRE_REVERSE_ENS) {
      try {
        const reverse = await provider.lookupAddress(recoveredAddress);
        if (!reverse) {
          return res.status(400).json(ENSResponses.reverseEnsMissing(recoveredAddress));
        }
        if (ens && reverse.toLowerCase() !== ens.toLowerCase()) {
          return res.status(400).json(ENSResponses.reverseEnsMismatch(recoveredAddress, ens, reverse));
        }
      } catch (e) {
        return res.status(400).json(ENSResponses.reverseEnsMissing(recoveredAddress));
      }
    }

    // Persist referral binding
    const insert = await pool.query(
      `INSERT INTO referrals
       (referral_code, referrer_ens, referrer_address, signature, siwe_message, nonce, ip_address, user_agent)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING id, verified_at`,
      [
        referralCode,
        ens || null,
        recoveredAddress,
        signature,
        message,
        fields.nonce,
        req.ip,
        req.headers["user-agent"] || null
      ]
    );

    // Make nonce single-use
    await pool.query("DELETE FROM nonces WHERE nonce = $1", [fields.nonce]);

    res.json({ success: true, referralId: insert.rows[0].id, verifiedAt: insert.rows[0].verified_at });
  } catch (err: any) {
    console.error("POST /api/verify error:", err);
    res.status(500).json({ error: err?.message || "Server error" });
  }
});

/**
 * POST /api/referral/event
 * - Protected via X-WEBHOOK-SECRET header (WEBHOOK_SECRET env var)
 * - Protected by rlMiddleware when enabled
 * - Body: { userId, referralCode, eventType, eventPayload, amount }
 */
app.post("/api/referral/event", rlMiddleware, async (req, res) => {
  try {
    const secretHeader = req.header("X-WEBHOOK-SECRET") || "";
    if (!WEBHOOK_SECRET || secretHeader !== WEBHOOK_SECRET) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { userId, referralCode, eventType, eventPayload, amount } = req.body;
    if (!referralCode || !eventType) {
      return res.status(400).json({ error: "Missing referralCode or eventType" });
    }

    // Find latest referral by code
    const ref = await pool.query(
      "SELECT id FROM referrals WHERE referral_code = $1 ORDER BY created_at DESC LIMIT 1",
      [referralCode]
    );
    if (ref.rowCount === 0) return res.status(404).json({ error: "Referral not found" });

    const referralId = ref.rows[0].id;
    const insert = await pool.query(
      `INSERT INTO attributed_events (referral_id, event_type, event_payload, amount)
       VALUES ($1,$2,$3,$4) RETURNING id, created_at`,
      [referralId, eventType, eventPayload || null, amount || null]
    );

    res.json({ success: true, eventId: insert.rows[0].id });
  } catch (err: any) {
    console.error("POST /api/referral/event error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/referral/event
 * - Returns recent referral events
 * - Protected by rlMiddleware when enabled
 */
app.get("/api/referral/event", rlMiddleware, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 100);
    const offset = Number(req.query.offset || 0);
    
    const result = await pool.query(
      `SELECT ae.id, ae.event_type, ae.event_payload, ae.amount, ae.created_at,
              r.referral_code, r.referrer_ens, r.referrer_address
       FROM attributed_events ae
       JOIN referrals r ON ae.referral_id = r.id
       ORDER BY ae.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json({ 
      success: true,
      events: result.rows,
      count: result.rowCount
    });
  } catch (err: any) {
    console.error("GET /api/referral/event error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * POST /api/referral/audit
 * - Logs audit events for tracking user activity
 * - Body: { eventType, userAddress?, ensName?, eventData?, ipAddress?, userAgent? }
 * - Protected by rlMiddleware when enabled
 */
app.post("/api/referral/audit", rlMiddleware, async (req, res) => {
  try {
    const { eventType, userAddress, ensName, eventData } = req.body;
    if (!eventType) {
      return res.status(400).json({ error: "Missing required field: eventType" });
    }

    const insert = await pool.query(
      `INSERT INTO audit_events (event_type, user_address, ens_name, event_data, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at`,
      [
        eventType,
        userAddress || null,
        ensName || null,
        eventData || null,
        req.ip,
        req.headers["user-agent"] || null
      ]
    );

    res.json({ 
      success: true, 
      auditId: insert.rows[0].id,
      createdAt: insert.rows[0].created_at,
      message: "Audit event logged successfully"
    });
  } catch (err: any) {
    console.error("POST /api/referral/audit error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * GET /api/referral/audit
 * - Returns recent audit events (admin use)
 * - Protected by rlMiddleware when enabled
 */
app.get("/api/referral/audit", rlMiddleware, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 100);
    const offset = Number(req.query.offset || 0);
    const eventType = req.query.eventType as string;
    
    let query = `
      SELECT id, event_type, user_address, ens_name, event_data, ip_address, created_at
      FROM audit_events
    `;
    const params: any[] = [];
    
    if (eventType) {
      query += ` WHERE event_type = $1`;
      params.push(eventType);
      query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
      params.push(limit, offset);
    } else {
      query += ` ORDER BY created_at DESC LIMIT $1 OFFSET $2`;
      params.push(limit, offset);
    }

    const result = await pool.query(query, params);

    res.json({ 
      success: true,
      events: result.rows,
      count: result.rowCount
    });
  } catch (err: any) {
    console.error("GET /api/referral/audit error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Phase 2: Reputation router mounting
 */
const reputationRouter = createReputationRouter(pool, provider, {
  requireReverseEns: REQUIRE_REVERSE_ENS,
  scoring: {
    base: 50,
    ensBonus: 20,
    perSuccess: 2,
    successCap: 10,
    perFailure: -5,
    failureCapNeg: -6,
    rateWindowHours: 24,
    rateThreshold: 20,
    ratePenaltyMax: 20,
    trustedThreshold: 80,
    probationThreshold: 30,
    blockedFailureCount: 6
  }
});
app.use("/api/reputation", reputationRouter);

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`SIWE referral server listening on port ${PORT}`);
  console.log(`ORIGIN: ${ORIGIN}  REQUIRE_REVERSE_ENS: ${REQUIRE_REVERSE_ENS}`);
  console.log(`RATE_LIMIT_ENABLED: ${RATE_LIMIT_ENABLED}`);
});

