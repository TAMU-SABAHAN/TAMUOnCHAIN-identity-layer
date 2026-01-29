-- TAMU OnCHAIN Identity Layer Schema

-- Nonces table for SIWE authentication
CREATE TABLE IF NOT EXISTS nonces (
  nonce VARCHAR(255) PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Referrals table for storing referral bindings
CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  referral_code VARCHAR(255) NOT NULL,
  referrer_ens VARCHAR(255),
  referrer_address VARCHAR(255) NOT NULL,
  signature TEXT NOT NULL,
  siwe_message TEXT NOT NULL,
  nonce VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attributed events table for referral event tracking
CREATE TABLE IF NOT EXISTS attributed_events (
  id SERIAL PRIMARY KEY,
  referral_id INTEGER NOT NULL REFERENCES referrals(id),
  event_type VARCHAR(255) NOT NULL,
  event_payload JSONB,
  amount DECIMAL(18, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit events table for tracking user activity
CREATE TABLE IF NOT EXISTS audit_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(255) NOT NULL,
  user_address VARCHAR(255),
  ens_name VARCHAR(255),
  event_data JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_address ON referrals(referrer_address);
CREATE INDEX IF NOT EXISTS idx_attributed_events_referral ON attributed_events(referral_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_address ON audit_events(user_address);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at);
