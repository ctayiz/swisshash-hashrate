-- ============================================================
-- SwissHash: Performance Indexes
-- ============================================================

-- orders
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_status      ON public.orders(status);
CREATE INDEX idx_orders_expires_at  ON public.orders(expires_at) WHERE status = 'active';
CREATE INDEX idx_orders_package_id  ON public.orders(package_id);
CREATE INDEX idx_orders_created_at  ON public.orders(created_at DESC);

-- order_events
CREATE INDEX idx_order_events_order_id   ON public.order_events(order_id);
CREATE INDEX idx_order_events_created_at ON public.order_events(created_at DESC);

-- proxy_config_versions
CREATE INDEX idx_proxy_configs_version    ON public.proxy_config_versions(version DESC);
CREATE INDEX idx_proxy_configs_created_at ON public.proxy_config_versions(created_at DESC);

-- customer_pool_configs
CREATE INDEX idx_pool_configs_user_id ON public.customer_pool_configs(user_id);

-- profiles
CREATE INDEX idx_profiles_role ON public.profiles(role);
