-- suggestions && the S-### reference sequence
create sequence if not exists suggestion_ref_seq
START 1;
create table if not exists suggestions (
   id          uuid primary key default gen_random_uuid(),
   ref         text unique not null,
   title       text not null,
   description text not null,
   status      text not null default 'open' check ( status in ( 'open',
                                                           'review',
                                                           'planned',
                                                           'progress',
                                                           'done',
                                                           'rejected' ) ),
   category    text not null default 'General',
   author_name text not null default '',
   author_role text not null default '',
   author_id   uuid
      references users ( id )
         on delete set null,
   votes       integer not null default 0,
   edited_at   timestamptz,
   created_at  timestamptz not null default now()
);