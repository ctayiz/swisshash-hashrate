-- ============================================================
-- SwissHash: Row Level Security Policies
-- ============================================================

-- Helper: check if current user is admin (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================================
-- profiles
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles: self read"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: admin read all"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "profiles: self update (no role escalation)"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "profiles: admin update all"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- ============================================================
-- packages
-- ============================================================
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "packages: authenticated read active"
  ON public.packages FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = TRUE);

CREATE POLICY "packages: admin read all"
  ON public.packages FOR SELECT
  USING (public.is_admin());

CREATE POLICY "packages: admin write"
  ON public.packages FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- customer_pool_configs
-- ============================================================
ALTER TABLE public.customer_pool_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pool_configs: customer manage own"
  ON public.customer_pool_configs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "pool_configs: admin read all"
  ON public.customer_pool_configs FOR SELECT
  USING (public.is_admin());

-- ============================================================
-- orders
-- ============================================================
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders: customer read own"
  ON public.orders FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "orders: customer insert own"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "orders: admin read all"
  ON public.orders FOR SELECT
  USING (public.is_admin());

CREATE POLICY "orders: admin update all"
  ON public.orders FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================================
-- order_events
-- ============================================================
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_events: customer read own"
  ON public.order_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_events.order_id
        AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY "order_events: admin read all"
  ON public.order_events FOR SELECT
  USING (public.is_admin());

-- Inserts only via service_role (API routes bypass RLS)
CREATE POLICY "order_events: no direct insert"
  ON public.order_events FOR INSERT
  WITH CHECK (FALSE);

-- ============================================================
-- proxy_config_versions
-- ============================================================
ALTER TABLE public.proxy_config_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proxy_configs: admin read"
  ON public.proxy_config_versions FOR SELECT
  USING (public.is_admin());

-- Inserts only via service_role
CREATE POLICY "proxy_configs: no direct insert"
  ON public.proxy_config_versions FOR INSERT
  WITH CHECK (FALSE);
