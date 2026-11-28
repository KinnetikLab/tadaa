-- Micrositios e invitaciones: solicitud de micrositio con videollamada, campañas de invitación
-- (función de prensa, F&F, estreno), invitaciones a particulares, patrocinadores y empresas
-- (por lista o por sorteo con códigos), pases individuales y acceso del staff por QR o por nombre.

CREATE TABLE IF NOT EXISTS minisite_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requested_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  production text NOT NULL,
  contact_phone text,
  notes text,
  slot timestamptz NOT NULL,
  duration_min integer NOT NULL DEFAULT 30,
  meet_url text NOT NULL,
  status text NOT NULL DEFAULT 'agendada' CHECK (status IN ('agendada','realizada','cancelada')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS minisite_requests_org_idx ON minisite_requests(organization_id, slot DESC);

CREATE TABLE IF NOT EXISTS invite_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_id uuid REFERENCES events(id) ON DELETE SET NULL,
  landing_slug text,
  site_url text,
  title text NOT NULL,
  starts_at timestamptz,
  venue text,
  doors text,
  created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS invite_campaigns_org_idx ON invite_campaigns(organization_id, created_at DESC);

CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES invite_campaigns(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES invitations(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  kind text NOT NULL DEFAULT 'particular' CHECK (kind IN ('particular','patrocinador','empresa')),
  assign text CHECK (assign IN ('lista','sorteo')),
  guest_name text,
  company text,
  email text,
  phone text,
  tickets integer NOT NULL DEFAULT 1 CHECK (tickets BETWEEN 0 AND 200),
  code text UNIQUE,
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','enviada','abierta','codigo','canjeada','cancelada')),
  sent_via text,
  sent_at timestamptz,
  opened_at timestamptz,
  redeemed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS invitations_campaign_idx ON invitations(campaign_id, created_at);

CREATE TABLE IF NOT EXISTS invitation_passes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_id uuid NOT NULL REFERENCES invitations(id) ON DELETE CASCADE,
  n integer NOT NULL,
  holder_name text,
  checked_in_at timestamptz,
  checked_in_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
  method text CHECK (method IN ('qr','nombre')),
  UNIQUE (invitation_id, n)
);
