-- Get nearby disease alerts within a radius
CREATE OR REPLACE FUNCTION get_nearby_alerts(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km INTEGER DEFAULT 50
)
RETURNS SETOF disease_alerts
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM disease_alerts
  WHERE active = true
    AND location IS NOT NULL
    AND ST_DWithin(
      location,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radius_km * 1000
    )
  ORDER BY reported_at DESC;
$$;

-- Get market price trends for a livestock type
CREATE OR REPLACE FUNCTION get_price_trends(
  p_livestock_type TEXT,
  p_state TEXT DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
  avg_price NUMERIC,
  min_price NUMERIC,
  max_price NUMERIC,
  report_count BIGINT,
  report_date DATE
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    AVG(price)::NUMERIC(12,2) AS avg_price,
    MIN(price) AS min_price,
    MAX(price) AS max_price,
    COUNT(*) AS report_count,
    submitted_at::DATE AS report_date
  FROM market_prices
  WHERE livestock_type = p_livestock_type
    AND submitted_at >= now() - (p_days || ' days')::INTERVAL
    AND (p_state IS NULL OR state = p_state)
  GROUP BY submitted_at::DATE
  ORDER BY report_date DESC;
$$;
