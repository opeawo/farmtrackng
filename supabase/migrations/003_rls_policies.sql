-- Row Level Security Policies

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE livestock_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccination_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE disease_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own
CREATE POLICY profiles_select ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY profiles_update ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY profiles_insert ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Livestock: users manage their own
CREATE POLICY livestock_all ON livestock_inventory FOR ALL USING (auth.uid() = user_id);

-- Farm Records: users manage their own
CREATE POLICY records_all ON farm_records FOR ALL USING (auth.uid() = user_id);

-- Health Incidents: users manage their own, can read all for alerts
CREATE POLICY health_own ON health_incidents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY health_read_all ON health_incidents FOR SELECT USING (true);

-- Vaccination Schedules: users manage their own
CREATE POLICY vaccinations_all ON vaccination_schedules FOR ALL USING (auth.uid() = user_id);

-- Market Prices: anyone can read, authenticated can insert
CREATE POLICY market_read ON market_prices FOR SELECT USING (true);
CREATE POLICY market_insert ON market_prices FOR INSERT WITH CHECK (auth.uid() = submitted_by);

-- Disease Alerts: anyone can read, authenticated can insert
CREATE POLICY alerts_read ON disease_alerts FOR SELECT USING (true);
CREATE POLICY alerts_insert ON disease_alerts FOR INSERT WITH CHECK (auth.uid() = reported_by);

-- WhatsApp: service role only (handled via API routes)
CREATE POLICY wa_service ON whatsapp_conversations FOR ALL USING (auth.uid() = user_id);

-- Points: users can read their own
CREATE POLICY points_read ON farm_points FOR SELECT USING (auth.uid() = user_id);

-- Referrals: users manage their own
CREATE POLICY referrals_all ON referrals FOR ALL USING (auth.uid() = referrer_id);
