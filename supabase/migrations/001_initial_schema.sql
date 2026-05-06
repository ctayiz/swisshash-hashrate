-- ============================================================
-- SwissHash: Initial Schema
-- ============================================================

-- profiles: extends auth.users
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'customer'
                CHECK (role IN ('customer', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- packages: the 9 product catalog entries
CREATE TABLE public.packages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  hashrate_th   INTEGER NOT NULL CHECK (hashrate_th > 0),
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  price_usd     NUMERIC(10,2) NOT NULL CHECK (price_usd >= 0),
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  stripe_price_id TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (hashrate_th, duration_days)
);

-- customer_pool_configs: mining pool settings per customer
CREATE TABLE public.customer_pool_configs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  pool_url    TEXT NOT NULL,
  pool_port   INTEGER NOT NULL DEFAULT 3333,
  worker_name TEXT NOT NULL,
  password    TEXT NOT NULL DEFAULT 'x',
  tls         BOOLEAN NOT NULL DEFAULT FALSE,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- orders: one row per purchase
CREATE TABLE public.orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  package_id      UUID NOT NULL REFERENCES public.packages(id) ON DELETE RESTRICT,
  pool_config_id  UUID REFERENCES public.customer_pool_configs(id) ON DELETE SET NULL,
  -- immutable snapshot at order time
  hashrate_th     INTEGER NOT NULL,
  duration_days   INTEGER NOT NULL,
  price_usd       NUMERIC(10,2) NOT NULL,
  -- lifecycle
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','active','paused','expired','cancelled')),
  activated_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  paused_at       TIMESTAMPTZ,
  remaining_seconds INTEGER CHECK (remaining_seconds IS NULL OR remaining_seconds >= 0),
  activated_by    UUID REFERENCES public.profiles(id),
  -- stripe
  stripe_session_id     TEXT,
  stripe_payment_intent TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- order_events: full audit trail
CREATE TABLE public.order_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type  TEXT NOT NULL
              CHECK (event_type IN (
                'created','activated','expired','cancelled','noted','payment_received',
                'paused','resumed','reactivated'
              )),
  actor_id    UUID REFERENCES public.profiles(id),
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- proxy_config_versions: versioned YAML history
CREATE TABLE public.proxy_config_versions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version             INTEGER NOT NULL UNIQUE,
  yaml_content        TEXT NOT NULL,
  total_hashrate_th   INTEGER NOT NULL DEFAULT 0,
  active_order_count  INTEGER NOT NULL DEFAULT 0,
  trigger_source      TEXT NOT NULL
                      CHECK (trigger_source IN (
                        'order_activated','order_expired',
                        'order_cancelled','order_paused','order_resumed',
                        'order_reactivated','manual','cron','empty_fallback'
                      )),
  trigger_order_id    UUID REFERENCES public.orders(id),
  generated_by        UUID REFERENCES public.profiles(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Functions & Triggers
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enrich JWT with app_role (used in middleware — avoids extra DB call)
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = (event->>'user_id')::UUID;

  RETURN jsonb_set(
    event,
    '{claims,app_role}',
    to_jsonb(COALESCE(user_role, 'customer'))
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_pool_configs_updated_at
  BEFORE UPDATE ON public.customer_pool_configs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
