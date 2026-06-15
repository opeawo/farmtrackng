-- Schema for the accumulating Nigeria disease-outbreak dataset.
-- Run once in the Supabase SQL editor (or via the CLI).
--
-- The internal refresh tool (src/lib/server/outbreaks/refresh.ts) upserts into
-- `outbreaks` keyed by `key`; rows are never deleted ("keep everything").
-- `added_at` is the date an outbreak first appeared in the app; `last_seen`
-- is bumped each time the tool re-confirms it.

create table if not exists outbreaks (
  key          text primary key,         -- disease|state|source_url (dedup key)
  disease      text not null,
  species      text not null,            -- poultry|cattle|goat|sheep|pig|other
  state        text not null,            -- Nigerian state
  lga          text,                     -- Local Government Area, nullable
  severity     text not null,            -- monitor|treat|urgent
  summary      text not null,            -- one plain-language sentence
  date_posted  text not null,            -- date the source reported it
  source       text not null,            -- WOAH WAHIS|NADIS|ReliefWeb|other
  source_url   text not null,            -- the real page it was found on
  added_at     timestamptz not null default now(),
  last_seen    timestamptz not null default now()
);

create index if not exists outbreaks_state_idx on outbreaks (lower(state));
create index if not exists outbreaks_added_idx on outbreaks (added_at desc);

-- Tiny key/value table for the "last refreshed" marker (drives the
-- once-per-day, first-load refresh in the feed endpoint).
create table if not exists app_meta (
  key   text primary key,
  value text
);
