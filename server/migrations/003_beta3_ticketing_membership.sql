-- TADAA! BETA 3 — additive ticketing, membership entitlements and producer operations.
-- Safe to run after 001 and 002. Does not delete or rewrite existing records.

ALTER TABLE events
  ADD COLUMN IF NOT EXISTS ticketing_mode TEXT NOT NULL DEFAULT 'external',
  ADD COLUMN IF NOT EXISTS membership_promo_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS membership_promo_days INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS sales_policy JSONB NOT NULL DEFAULT '{}'::jsonb;

DO $$ BEGIN
  ALTER TABLE events ADD CONSTRAINT events_ticketing_mode_check
    CHECK (ticketing_mode IN ('tadaa','external'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE ticket_types
  ADD COLUMN IF NOT EXISTS member_only BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS service_fee_minor BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_per_order INTEGER NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS section_name TEXT,
  ADD COLUMN IF NOT EXISTS sales_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sales_end TIMESTAMPTZ;

DO $$ BEGIN
  ALTER TABLE ticket_types ADD CONSTRAINT ticket_types_fee_nonnegative CHECK(service_fee_minor >= 0);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE ticket_types ADD CONSTRAINT ticket_types_max_per_order CHECK(max_per_order BETWEEN 1 AND 20);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'tadaa',
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_user_idempotency
  ON orders(user_id,idempotency_key) WHERE idempotency_key IS NOT NULL;

ALTER TABLE memberships
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS auto_renew_authorized BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS renewal_provider TEXT,
  ADD COLUMN IF NOT EXISTS provider_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS last_order_id UUID REFERENCES orders(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS membership_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK(source IN ('ticket_purchase','campaign','admin_grant')),
  related_order_id UUID UNIQUE REFERENCES orders(id) ON DELETE SET NULL,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','expired','revoked')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(ends_at > starts_at)
);
CREATE INDEX IF NOT EXISTS idx_membership_entitlements_user
  ON membership_entitlements(user_id,status,ends_at);

CREATE TABLE IF NOT EXISTS membership_notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entitlement_id UUID REFERENCES membership_entitlements(id) ON DELETE CASCADE,
  membership_id UUID REFERENCES memberships(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  notice_key TEXT NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  delivered_at TIMESTAMPTZ,
  channel TEXT NOT NULL DEFAULT 'in_app',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(entitlement_id,notice_key),
  UNIQUE(membership_id,notice_key)
);
CREATE INDEX IF NOT EXISTS idx_membership_notices_due
  ON membership_notices(user_id,scheduled_at) WHERE delivered_at IS NULL;

CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_user_notifications_user
  ON user_notifications(user_id,created_at DESC);

CREATE TABLE IF NOT EXISTS ticket_refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK(status IN ('requested','under_review','approved_pending_provider','rejected','refunded')),
  requested_amount_minor BIGINT NOT NULL CHECK(requested_amount_minor >= 0),
  reviewed_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  provider_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON ticket_refund_requests(status,created_at);

CREATE TABLE IF NOT EXISTS producer_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE RESTRICT,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  gross_minor BIGINT NOT NULL DEFAULT 0,
  platform_fee_minor BIGINT NOT NULL DEFAULT 0,
  refund_minor BIGINT NOT NULL DEFAULT 0,
  net_minor BIGINT NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'MXN',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','approved','paid','cancelled')),
  reference TEXT,
  approved_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(period_end > period_start)
);
CREATE INDEX IF NOT EXISTS idx_settlements_org ON producer_settlements(organization_id,status,created_at DESC);

CREATE TABLE IF NOT EXISTS payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK(status IN ('received','processed','rejected')),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  UNIQUE(provider,provider_event_id)
);

CREATE TABLE IF NOT EXISTS event_seat_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  layout JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS event_seats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  seat_map_id UUID REFERENCES event_seat_maps(id) ON DELETE SET NULL,
  ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE SET NULL,
  section_name TEXT NOT NULL,
  row_label TEXT,
  seat_label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available','held','sold','blocked')),
  price_minor BIGINT CHECK(price_minor IS NULL OR price_minor >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id,section_name,row_label,seat_label)
);
CREATE INDEX IF NOT EXISTS idx_event_seats_availability ON event_seats(event_id,status,section_name);

ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS seat_id UUID REFERENCES event_seats(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS attendee_name TEXT,
  ADD COLUMN IF NOT EXISTS attendee_email TEXT;

CREATE TABLE IF NOT EXISTS merch_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','paid','cancelled','refunded')),
  total_minor BIGINT NOT NULL CHECK(total_minor >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS merch_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES merch_orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES merch_products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  unit_price_minor BIGINT NOT NULL CHECK(unit_price_minor >= 0),
  total_minor BIGINT NOT NULL CHECK(total_minor >= 0)
);

CREATE TABLE IF NOT EXISTS awards_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','nominations','voting','closed')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS award_nominations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES awards_programs(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  submitted_by UUID REFERENCES app_users(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS award_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nomination_id UUID NOT NULL REFERENCES award_nominations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(nomination_id,user_id)
);

CREATE TABLE IF NOT EXISTS order_item_seats (
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL UNIQUE REFERENCES event_seats(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(order_item_id,seat_id)
);

ALTER TABLE user_notifications
  ADD COLUMN IF NOT EXISTS membership_notice_id UUID REFERENCES membership_notices(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_notifications_notice
  ON user_notifications(membership_notice_id) WHERE membership_notice_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS cashback_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  rate_bps INTEGER NOT NULL CHECK(rate_bps BETWEEN 1 AND 5000),
  max_cashback_minor BIGINT CHECK(max_cashback_minor IS NULL OR max_cashback_minor >= 0),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','paused','ended')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_cashback_rules_active ON cashback_rules(status,event_id,starts_at,ends_at);

CREATE TABLE IF NOT EXISTS reward_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE RESTRICT,
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  rule_id UUID REFERENCES cashback_rules(id) ON DELETE SET NULL,
  amount_minor BIGINT NOT NULL CHECK(amount_minor >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','available','redeemed','expired','reversed')),
  available_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reward_ledger_user ON reward_ledger(user_id,status,available_at);

CREATE TABLE IF NOT EXISTS golden_ticket_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  prize TEXT NOT NULL,
  winner_count INTEGER NOT NULL DEFAULT 1 CHECK(winner_count BETWEEN 1 AND 100),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','closed','drawn')),
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK(ends_at > starts_at)
);
CREATE TABLE IF NOT EXISTS golden_ticket_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES golden_ticket_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  entry_source TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'entered' CHECK(status IN ('entered','winner','not_selected','withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id,user_id)
);

CREATE TABLE IF NOT EXISTS promotional_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  campaign_type TEXT NOT NULL CHECK(campaign_type IN ('seasonal','theater','cinema','hot_sale','buen_fin','institutional','other')),
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','scheduled','active','paused','ended')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE merch_products
  ADD COLUMN IF NOT EXISTS reserved_stock INTEGER NOT NULL DEFAULT 0 CHECK(reserved_stock >= 0);
ALTER TABLE merch_products
  ADD COLUMN IF NOT EXISTS max_per_order INTEGER NOT NULL DEFAULT 10 CHECK(max_per_order BETWEEN 1 AND 50);

ALTER TABLE merch_orders
  ADD COLUMN IF NOT EXISTS order_id UUID UNIQUE REFERENCES orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

ALTER TABLE merch_products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS golden_ticket_draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL UNIQUE REFERENCES golden_ticket_campaigns(id) ON DELETE RESTRICT,
  winners JSONB NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'crypto.randomInt/fisher-yates',
  drawn_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
