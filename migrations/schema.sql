-- TAMU OnCHAIN Identity Layer - Database Schema
-- Fail SQL untuk buat table user dan table lain supaya pangkalan data tidak kosong
-- This is the most important file! SQL code to create user table and other tables.

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER TABLE (Main requirement from problem statement)
-- ============================================
-- Table to store user information for the identity layer
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) NOT NULL UNIQUE,  -- Ethereum address (0x...)
    ens_name VARCHAR(255),                -- ENS name if available
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb    -- Additional user metadata
);

-- Index for faster lookups by address
CREATE INDEX IF NOT EXISTS idx_users_address ON users(address);
CREATE INDEX IF NOT EXISTS idx_users_ens_name ON users(ens_name);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- ============================================
-- NONCES TABLE
-- ============================================
-- Table to store single-use nonces for SIWE authentication
CREATE TABLE IF NOT EXISTS nonces (
    id SERIAL PRIMARY KEY,
    nonce VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster nonce lookups
CREATE INDEX IF NOT EXISTS idx_nonces_nonce ON nonces(nonce);
CREATE INDEX IF NOT EXISTS idx_nonces_expires_at ON nonces(expires_at);

-- ============================================
-- REFERRALS TABLE
-- ============================================
-- Table to store referral information and SIWE verification data
CREATE TABLE IF NOT EXISTS referrals (
    id SERIAL PRIMARY KEY,
    referral_code VARCHAR(255) NOT NULL,
    referrer_ens VARCHAR(255),
    referrer_address VARCHAR(42) NOT NULL,
    signature TEXT NOT NULL,
    siwe_message TEXT NOT NULL,
    nonce VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),               -- Support IPv4 and IPv6
    user_agent TEXT,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);
CREATE INDEX IF NOT EXISTS idx_referrals_address ON referrals(referrer_address);
CREATE INDEX IF NOT EXISTS idx_referrals_created_at ON referrals(created_at DESC);

-- ============================================
-- ATTRIBUTED EVENTS TABLE
-- ============================================
-- Table to track events attributed to referrals
CREATE TABLE IF NOT EXISTS attributed_events (
    id SERIAL PRIMARY KEY,
    referral_id INTEGER NOT NULL REFERENCES referrals(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_payload JSONB,
    amount NUMERIC(18, 8),                -- Support cryptocurrency amounts
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_attributed_events_referral_id ON attributed_events(referral_id);
CREATE INDEX IF NOT EXISTS idx_attributed_events_type ON attributed_events(event_type);
CREATE INDEX IF NOT EXISTS idx_attributed_events_created_at ON attributed_events(created_at DESC);

-- ============================================
-- REPUTATION SCORES TABLE (Phase 2)
-- ============================================
-- Table to store reputation scores for addresses
CREATE TABLE IF NOT EXISTS reputation_scores (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) NOT NULL UNIQUE,
    score INTEGER NOT NULL DEFAULT 50,    -- Base score is 50
    ens_name VARCHAR(255),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for faster address lookups
CREATE INDEX IF NOT EXISTS idx_reputation_scores_address ON reputation_scores(address);
CREATE INDEX IF NOT EXISTS idx_reputation_scores_score ON reputation_scores(score);

-- ============================================
-- REPUTATION EVENTS TABLE (Phase 2)
-- ============================================
-- Table to track reputation-affecting events
CREATE TABLE IF NOT EXISTS reputation_events (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) NOT NULL,
    event_type VARCHAR(50) NOT NULL,      -- 'success', 'failure', 'rate_limit_penalty', etc.
    score_change INTEGER NOT NULL,        -- Positive or negative change
    previous_score INTEGER NOT NULL,
    new_score INTEGER NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for querying reputation history
CREATE INDEX IF NOT EXISTS idx_reputation_events_address ON reputation_events(address);
CREATE INDEX IF NOT EXISTS idx_reputation_events_type ON reputation_events(event_type);
CREATE INDEX IF NOT EXISTS idx_reputation_events_created_at ON reputation_events(created_at DESC);

-- ============================================
-- RATE LIMIT DATA TABLE (Phase 3A)
-- ============================================
-- Table to store rate limiting data (backup/persistent storage)
CREATE TABLE IF NOT EXISTS rate_limit_data (
    id SERIAL PRIMARY KEY,
    address VARCHAR(42) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0,
    window_start TIMESTAMP WITH TIME ZONE NOT NULL,
    window_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(address, endpoint, window_start)
);

-- Indexes for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_address_endpoint ON rate_limit_data(address, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_window ON rate_limit_data(window_end);

-- ============================================
-- HELPER FUNCTION: Update timestamp
-- ============================================
-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to rate_limit_data table
DROP TRIGGER IF EXISTS update_rate_limit_updated_at ON rate_limit_data;
CREATE TRIGGER update_rate_limit_updated_at 
    BEFORE UPDATE ON rate_limit_data 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CLEANUP FUNCTION: Remove expired nonces
-- ============================================
-- Function to clean up expired nonces (can be called periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_nonces()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM nonces WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- INITIAL DATA (Optional)
-- ============================================
-- Insert a sample system user (optional, can be removed if not needed)
INSERT INTO users (address, ens_name, metadata) 
VALUES (
    '0x0000000000000000000000000000000000000000',
    'system.eth',
    '{"type": "system", "description": "System account for internal operations"}'::jsonb
) ON CONFLICT (address) DO NOTHING;

-- ============================================
-- GRANTS (for application user)
-- ============================================
-- Grant necessary permissions to the application
-- Note: Adjust username if different from default
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- ============================================
-- SCHEMA INFORMATION
-- ============================================
-- This schema supports:
-- - Phase 1: SIWE (Sign-In With Ethereum) authentication with nonces and referrals
-- - Phase 2: Reputation system with scoring and event tracking
-- - Phase 3A: Rate limiting with Redis cache backup
-- - User management with Ethereum addresses and ENS names
-- ============================================
