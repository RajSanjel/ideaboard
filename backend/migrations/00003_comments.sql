-- comments (parent_id self-FK gives threads)
create table if not exists comments (
   id            uuid primary key default gen_random_uuid(),
   suggestion_id uuid not null
      references suggestions ( id )
         on delete cascade,
   parent_id     uuid
      references comments ( id )
         on delete cascade,
   body          text not null,
   votes         integer not null default 0,
   author_name   text not null default '',
   author_role   text not null default '',
   author_id     uuid
      references users ( id )
         on delete set null,
   edited_at     timestamptz,
   created_at    timestamptz not null default now()
);