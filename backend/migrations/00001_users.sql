create table if not exists users (
   id            uuid primary key default gen_random_uuid(),
   name          text not null,
   email         text unique not null,
   password_hash text not null,
   role          text not null default 'Community member',
   is_staff      boolean not null default false,
   is_admin      boolean not null default false,
   created_at    timestamptz not null default now()
);