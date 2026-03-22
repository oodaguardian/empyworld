-- ═══════════════════════════════════════════════════════════════
--  Empy World — Messages, Calls & Push Subscriptions
--  Run: supabase db push  (after `supabase init` + `supabase link`)
-- ═══════════════════════════════════════════════════════════════

-- ── Extension ──────────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Messages ───────────────────────────────────────────────────
create table if not exists messages (
  id          uuid primary key default uuid_generate_v4(),
  sender_id   text not null,
  sender_name text not null,
  type        text not null check (type in ('text', 'voice')),
  content     text,
  audio_url   text,
  read        boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table messages enable row level security;

-- Anyone (anon) can read + insert messages (locked down via RLS in production)
create policy "public read messages"  on messages for select using (true);
create policy "public insert messages" on messages for insert with check (true);
create policy "public update messages" on messages for update using (true);

-- ── Calls ──────────────────────────────────────────────────────
create table if not exists calls (
  id          uuid primary key default uuid_generate_v4(),
  caller_id   text not null,
  caller_name text not null,
  type        text not null check (type in ('video', 'audio')),
  room_id     text not null,
  status      text not null default 'ringing'
                check (status in ('ringing','accepted','declined','cancelled','ended','missed')),
  created_at  timestamptz not null default now()
);

alter table calls enable row level security;

create policy "public read calls"   on calls for select using (true);
create policy "public insert calls" on calls for insert with check (true);
create policy "public update calls" on calls for update using (true);

-- ── Push subscriptions ──────────────────────────────────────────
create table if not exists push_subscriptions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     text not null unique,
  endpoint    text not null,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

alter table push_subscriptions enable row level security;

create policy "public read subscriptions"   on push_subscriptions for select using (true);
create policy "public upsert subscriptions" on push_subscriptions for insert with check (true);
create policy "public update subscriptions" on push_subscriptions for update using (true);
create policy "public delete subscriptions" on push_subscriptions for delete using (true);

-- ── Realtime ──────────────────────────────────────────────────
-- Enable realtime for messages and calls tables
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table calls;
