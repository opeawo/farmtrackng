-- Performance and geographic indexes

CREATE INDEX idx_livestock_user ON livestock_inventory(user_id);
CREATE INDEX idx_records_user ON farm_records(user_id);
CREATE INDEX idx_records_type ON farm_records(record_type);
CREATE INDEX idx_records_date ON farm_records(recorded_at DESC);
CREATE INDEX idx_health_user ON health_incidents(user_id);
CREATE INDEX idx_health_status ON health_incidents(status);
CREATE INDEX idx_vaccinations_user ON vaccination_schedules(user_id);
CREATE INDEX idx_vaccinations_date ON vaccination_schedules(scheduled_date);
CREATE INDEX idx_vaccinations_pending ON vaccination_schedules(user_id) WHERE completed = false;
CREATE INDEX idx_market_prices_type ON market_prices(livestock_type);
CREATE INDEX idx_market_prices_state ON market_prices(state);
CREATE INDEX idx_market_prices_date ON market_prices(submitted_at DESC);
CREATE INDEX idx_alerts_active ON disease_alerts(active) WHERE active = true;
CREATE INDEX idx_alerts_state ON disease_alerts(state);
CREATE INDEX idx_wa_conversations_user ON whatsapp_conversations(user_id);
CREATE INDEX idx_wa_conversations_phone ON whatsapp_conversations(phone);
CREATE INDEX idx_farm_points_user ON farm_points(user_id);

-- Geographic indexes
CREATE INDEX idx_profiles_location ON profiles USING GIST(location);
CREATE INDEX idx_health_location ON health_incidents USING GIST(location);
CREATE INDEX idx_market_location ON market_prices USING GIST(location);
CREATE INDEX idx_alerts_location ON disease_alerts USING GIST(location);
