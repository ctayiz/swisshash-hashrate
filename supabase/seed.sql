-- ============================================================
-- SwissHash: Seed Data
-- Run after migrations. Idempotent via ON CONFLICT DO NOTHING.
-- ============================================================

-- 9 hashrate packages (120 / 300 / 500 TH × 1 / 3 / 5 days)
INSERT INTO public.packages (name, hashrate_th, duration_days, price_usd) VALUES
  ('120 TH · 1 Tag',   120, 1,  12.00),
  ('120 TH · 3 Tage',  120, 3,  30.00),
  ('120 TH · 5 Tage',  120, 5,  45.00),
  ('300 TH · 1 Tag',   300, 1,  28.00),
  ('300 TH · 3 Tage',  300, 3,  72.00),
  ('300 TH · 5 Tage',  300, 5, 105.00),
  ('500 TH · 1 Tag',   500, 1,  45.00),
  ('500 TH · 3 Tage',  500, 3, 115.00),
  ('500 TH · 5 Tage',  500, 5, 170.00)
ON CONFLICT (hashrate_th, duration_days) DO NOTHING;

-- After deploying, promote your first admin user:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@yourdomain.com';
