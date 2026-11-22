-- TADAA BETA 2: additive schema. Designed not to change or delete existing production records.
CREATE TABLE IF NOT EXISTS user_sessions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
 token_hash TEXT NOT NULL UNIQUE, csrf_token TEXT NOT NULL, expires_at TIMESTAMPTZ NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), revoked_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id,expires_at);
CREATE TABLE IF NOT EXISTS user_profiles (
 user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
 given_name TEXT, middle_names TEXT, paternal_surname TEXT, maternal_surname TEXT,
 dob DATE, address JSONB NOT NULL DEFAULT '{}'::jsonb,
 interests TEXT[] NOT NULL DEFAULT '{}'::text[], preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(),updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS partner_agreements (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 kind TEXT NOT NULL CHECK(kind IN('company','producer','institution')), status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN('draft','active','paused','ended')),
 starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ, terms JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS company_employees (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 employee_code TEXT NOT NULL, given_name TEXT NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE,
 claimed_by UUID REFERENCES app_users(id) ON DELETE SET NULL, approved_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 UNIQUE (organization_id,employee_code)
);
CREATE TABLE IF NOT EXISTS employee_import_batches (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
 uploaded_by UUID REFERENCES app_users(id) ON DELETE SET NULL, kind TEXT NOT NULL CHECK(kind IN('altas','bajas')),
 original_filename TEXT NOT NULL, records JSONB NOT NULL, summary JSONB NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','applied','cancelled')),
 confirmed_by UUID REFERENCES app_users(id) ON DELETE SET NULL, confirmed_at TIMESTAMPTZ,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS memberships (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','active','past_due','cancelled','expired')),
 price_minor INTEGER NOT NULL DEFAULT 10000, currency CHAR(3) NOT NULL DEFAULT 'MXN',
 current_period_start TIMESTAMPTZ,current_period_end TIMESTAMPTZ,cancel_at_period_end BOOLEAN DEFAULT FALSE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_memberships_user ON memberships(user_id,status);
CREATE TABLE IF NOT EXISTS event_favorites (
 user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
 event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
 created_at TIMESTAMPTZ DEFAULT now(), PRIMARY KEY(user_id,event_id)
);
CREATE TABLE IF NOT EXISTS event_extras (
 event_id UUID PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
 poster_url TEXT, hero_url TEXT, ticket_url TEXT, mobile_url TEXT, credits JSONB NOT NULL DEFAULT '[]'::jsonb,
 instructions JSONB NOT NULL DEFAULT '[]'::jsonb, spotify_url TEXT, maps_url TEXT,
 picks BOOLEAN NOT NULL DEFAULT FALSE, recommendation_tags TEXT[] NOT NULL DEFAULT '{}'::text[]
);
CREATE TABLE IF NOT EXISTS partner_presentations (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
 slug TEXT NOT NULL UNIQUE, title TEXT NOT NULL, subtitle TEXT, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN('draft','published')),
 slides JSONB NOT NULL DEFAULT '[]'::jsonb, theme JSONB NOT NULL DEFAULT '{}'::jsonb,
 created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS partner_applications (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), presentation_id UUID REFERENCES partner_presentations(id) ON DELETE SET NULL,
 organization_name TEXT NOT NULL, contact_name TEXT NOT NULL, email TEXT NOT NULL,
 phone TEXT, kind TEXT NOT NULL DEFAULT 'company', message TEXT,
 status TEXT NOT NULL DEFAULT 'new', created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS partner_meeting_requests (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), presentation_id UUID REFERENCES partner_presentations(id) ON DELETE SET NULL,
 contact_name TEXT NOT NULL, email TEXT NOT NULL, requested_at TIMESTAMPTZ NOT NULL,
 timezone TEXT NOT NULL, notes TEXT, status TEXT NOT NULL DEFAULT 'requested', created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ticket_scans (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ticket_id UUID NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
 scanned_by UUID REFERENCES app_users(id) ON DELETE SET NULL, result TEXT NOT NULL,
 created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ticket_allocations (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
 ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
 provider TEXT NOT NULL DEFAULT 'tadaa', external_reference TEXT, quantity INTEGER NOT NULL DEFAULT 0,
 metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS promo_campaigns (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, code TEXT UNIQUE, kind TEXT NOT NULL,
 value JSONB NOT NULL DEFAULT '{}'::jsonb, starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ,
 status TEXT DEFAULT 'draft', created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS reward_ledger (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
 kind TEXT NOT NULL, points INTEGER NOT NULL, source TEXT NOT NULL,
 metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS merch_products (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
 event_id UUID REFERENCES events(id) ON DELETE SET NULL, title TEXT NOT NULL, description TEXT,
 price_minor BIGINT NOT NULL CHECK(price_minor>=0), stock INTEGER NOT NULL DEFAULT 0 CHECK(stock>=0),
 image_url TEXT, published BOOLEAN NOT NULL DEFAULT FALSE, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS golden_experiences (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, event_id UUID REFERENCES events(id) ON DELETE SET NULL,
 rules JSONB NOT NULL DEFAULT '{}'::jsonb, status TEXT NOT NULL DEFAULT 'draft',
 starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS golden_entries (
 experience_id UUID NOT NULL REFERENCES golden_experiences(id) ON DELETE CASCADE,
 user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE, created_at TIMESTAMPTZ DEFAULT now(),
 PRIMARY KEY (experience_id,user_id)
);
CREATE TABLE IF NOT EXISTS audit_actions (
 id BIGSERIAL PRIMARY KEY, actor UUID REFERENCES app_users(id) ON DELETE SET NULL,
 action TEXT NOT NULL, entity TEXT NOT NULL, entity_id TEXT,
 details JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_employees_company ON company_employees(organization_id,active);
CREATE INDEX IF NOT EXISTS idx_partner_meeting ON partner_meeting_requests(requested_at,status);
CREATE INDEX IF NOT EXISTS idx_event_extras_picks ON event_extras(picks);
CREATE TABLE IF NOT EXISTS interest_alerts (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(), email TEXT NOT NULL UNIQUE,
 interests TEXT[] NOT NULL DEFAULT '{}'::text[], consent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
 created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
