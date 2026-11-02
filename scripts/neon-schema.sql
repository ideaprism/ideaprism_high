CREATE SCHEMA IF NOT EXISTS ideaprism_high;
CREATE TABLE IF NOT EXISTS ideaprism_high.partner_organizations (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, org_type TEXT NOT NULL,
  school_id TEXT CHECK(school_id IS NULL OR school_id IN ('mirae','boseong','samil','daegwang')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  region TEXT, contact_name TEXT, contact_email TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP::text),
  CHECK(org_type <> 'school' OR school_id IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS ideaprism_high.access_codes (
  id TEXT PRIMARY KEY, code TEXT NOT NULL UNIQUE,
  organization_id TEXT NOT NULL REFERENCES ideaprism_high.partner_organizations(id),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
  expires_at TEXT, max_usage INTEGER, usage_count INTEGER NOT NULL DEFAULT 0,
  label TEXT, created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP::text),
  session_version INTEGER NOT NULL DEFAULT 1 CHECK(session_version >= 1)
);
CREATE TABLE IF NOT EXISTS ideaprism_high.partnership_inquiries (
  id TEXT PRIMARY KEY, org_name TEXT, contact_name TEXT, contact_email TEXT,
  purpose TEXT, status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP::text)
);
