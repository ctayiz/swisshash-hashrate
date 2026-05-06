-- ============================================================
-- SwissHash: Mining-time based order limits
-- ============================================================

-- Keep schema constraints in sync with the lifecycle states already used by
-- the application code.
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending','active','paused','expired','cancelled'));

ALTER TABLE public.order_events
  DROP CONSTRAINT IF EXISTS order_events_event_type_check;

ALTER TABLE public.order_events
  ADD CONSTRAINT order_events_event_type_check
  CHECK (event_type IN (
    'created','activated','expired','cancelled','noted','payment_received',
    'paused','resumed','reactivated'
  ));

ALTER TABLE public.proxy_config_versions
  DROP CONSTRAINT IF EXISTS proxy_config_versions_trigger_source_check;

ALTER TABLE public.proxy_config_versions
  ADD CONSTRAINT proxy_config_versions_trigger_source_check
  CHECK (trigger_source IN (
    'order_activated','order_expired','order_cancelled',
    'order_paused','order_resumed','order_reactivated',
    'manual','cron','empty_fallback'
  ));

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS remaining_seconds INTEGER;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_remaining_seconds_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_remaining_seconds_check
  CHECK (remaining_seconds IS NULL OR remaining_seconds >= 0);
