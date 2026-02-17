-- FarmTrack Nigeria - Initial Schema

-- Enable PostGIS for geographic queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT UNIQUE,
  whatsapp_opted_in BOOLEAN DEFAULT false,
  state TEXT,
  lga TEXT,
  location GEOGRAPHY(POINT, 4326),
  preferred_language TEXT DEFAULT 'en',
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Livestock Inventory
CREATE TABLE livestock_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  livestock_type TEXT NOT NULL,
  breed TEXT,
  count INTEGER NOT NULL DEFAULT 1,
  tag_id TEXT,
  date_acquired DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Farm Records
CREATE TABLE farm_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  livestock_id UUID REFERENCES livestock_inventory(id) ON DELETE SET NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('feeding', 'treatment', 'sale', 'purchase', 'birth', 'death', 'expense', 'income', 'note')),
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2),
  currency TEXT DEFAULT 'NGN',
  quantity INTEGER,
  voice_url TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Health Incidents
CREATE TABLE health_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  livestock_id UUID REFERENCES livestock_inventory(id) ON DELETE SET NULL,
  symptoms TEXT[] NOT NULL DEFAULT '{}',
  suspected_disease TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'referred')),
  notes TEXT,
  location GEOGRAPHY(POINT, 4326),
  reported_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- Vaccination Schedules
CREATE TABLE vaccination_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  livestock_id UUID REFERENCES livestock_inventory(id) ON DELETE SET NULL,
  vaccine_name TEXT NOT NULL,
  disease_target TEXT NOT NULL,
  scheduled_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  reminder_sent BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Market Prices
CREATE TABLE market_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  livestock_type TEXT NOT NULL,
  breed TEXT,
  price NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'NGN',
  market_name TEXT NOT NULL,
  state TEXT NOT NULL,
  lga TEXT,
  location GEOGRAPHY(POINT, 4326),
  verified BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

-- Disease Alerts
CREATE TABLE disease_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  disease_name TEXT NOT NULL,
  livestock_type TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  state TEXT NOT NULL,
  lga TEXT,
  location GEOGRAPHY(POINT, 4326),
  radius_km INTEGER DEFAULT 50,
  active BOOLEAN DEFAULT true,
  confirmed BOOLEAN DEFAULT false,
  reported_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')
);

-- WhatsApp Conversations
CREATE TABLE whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  phone TEXT NOT NULL,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  message_type TEXT DEFAULT 'text',
  content TEXT,
  intent TEXT,
  wa_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Farm Points (Gamification)
CREATE TABLE farm_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Referrals
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_phone TEXT NOT NULL,
  referred_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'joined', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now()
);
