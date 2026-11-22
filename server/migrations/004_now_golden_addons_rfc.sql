-- TADAA! Ticket vibrante — Now!, Golden Ticket aleatorio, add-ons, RFC, staff y ofertas de reafiliación.
-- Aditiva y segura después de 001–003. No borra ni reescribe registros existentes.

-- ── RFC: una sola cuenta por persona ───────────────────────────────────────────
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS rfc TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_rfc ON user_profiles(upper(rfc)) WHERE rfc IS NOT NULL;
ALTER TABLE company_employees ADD COLUMN IF NOT EXISTS rfc TEXT;
ALTER TABLE company_employees ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_company_employees_rfc ON company_employees(upper(rfc)) WHERE rfc IS NOT NULL;
ALTER TABLE memberships ADD COLUMN IF NOT EXISTS rfc TEXT;

-- ── Estados del boleto: pase provisional → en entrega → boleto final ───────────
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS delivery_status TEXT NOT NULL DEFAULT 'final',
  ADD COLUMN IF NOT EXISTS external_reference TEXT,
  ADD COLUMN IF NOT EXISTS golden BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS golden_benefit JSONB,
  ADD COLUMN IF NOT EXISTS golden_revealed_at TIMESTAMPTZ;
DO $$ BEGIN
  ALTER TABLE tickets ADD CONSTRAINT tickets_delivery_status_check
    CHECK (delivery_status IN ('provisional','delivering','final'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
CREATE INDEX IF NOT EXISTS idx_tickets_golden ON tickets(golden) WHERE golden;

-- ── Now! (venta de último minuto con registro previo) ───────────────────────────
CREATE TABLE IF NOT EXISTS now_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
  function_label TEXT,
  opens_at TIMESTAMPTZ NOT NULL,
  closes_at TIMESTAMPTZ,
  price_minor BIGINT CHECK (price_minor IS NULL OR price_minor >= 0),
  quota INTEGER NOT NULL CHECK (quota > 0),
  max_per_user INTEGER NOT NULL DEFAULT 2 CHECK (max_per_user BETWEEN 1 AND 8),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ticket_type_id)
);
CREATE INDEX IF NOT EXISTS idx_now_campaigns_event ON now_campaigns(event_id,enabled);

CREATE TABLE IF NOT EXISTS now_signups (
  campaign_id UUID NOT NULL REFERENCES now_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (campaign_id,user_id)
);

-- ── Golden Ticket aleatorio por evento (1 de cada 100 por defecto) ──────────────
CREATE TABLE IF NOT EXISTS event_golden_config (
  event_id UUID PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  odds INTEGER NOT NULL DEFAULT 100 CHECK (odds BETWEEN 2 AND 100000),
  max_winners INTEGER NOT NULL DEFAULT 10 CHECK (max_winners >= 0),
  benefit_kind TEXT NOT NULL DEFAULT 'upgrade' CHECK (benefit_kind IN ('upgrade','meet_greet','ticket','custom')),
  benefit_title TEXT NOT NULL DEFAULT 'Upgrade de sección',
  benefit_detail TEXT,
  benefit_event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Add-ons por evento (merch, combos, fast pass…) ──────────────────────────────
CREATE TABLE IF NOT EXISTS event_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'merch' CHECK (kind IN ('merch','combo','food','experience','parking')),
  title TEXT NOT NULL,
  description TEXT,
  price_minor BIGINT NOT NULL CHECK (price_minor >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  max_per_order INTEGER NOT NULL DEFAULT 4 CHECK (max_per_order BETWEEN 1 AND 20),
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_event_addons_event ON event_addons(event_id,active);

CREATE TABLE IF NOT EXISTS order_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES event_addons(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price_minor BIGINT NOT NULL CHECK (unit_price_minor >= 0),
  total_minor BIGINT NOT NULL CHECK (total_minor >= 0),
  delivered_at TIMESTAMPTZ,
  delivered_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  UNIQUE (order_id,addon_id)
);

-- ── Staff: accesos verificados para boletera externa / pases provisionales ──────
CREATE TABLE IF NOT EXISTS order_access_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  checked_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  people INTEGER NOT NULL DEFAULT 1 CHECK (people > 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_order_access_checks_order ON order_access_checks(order_id);

-- ── Ofertas de membresía (p. ej. “Un pajarito nos contó…” 3 meses al 50%) ────────
CREATE TABLE IF NOT EXISTS membership_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'company_exit',
  discount_pct INTEGER NOT NULL DEFAULT 50 CHECK (discount_pct BETWEEN 1 AND 100),
  months_total INTEGER NOT NULL DEFAULT 3 CHECK (months_total > 0),
  months_used INTEGER NOT NULL DEFAULT 0 CHECK (months_used >= 0),
  source_organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '60 days',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_membership_offers_open
  ON membership_offers(user_id,kind) WHERE months_used < months_total;
