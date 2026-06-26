-- vote join tables (composite PK = one vote per user)
create table if not exists suggestion_votes (
   suggestion_id uuid not null
      references suggestions ( id )
         on delete cascade,
   user_id       uuid not null
      references users ( id )
         on delete cascade,
   primary key ( suggestion_id,
                 user_id )
);
create table if not exists comment_votes (
   comment_id uuid not null
      references comments ( id )
         on delete cascade,
   user_id    uuid not null
      references users ( id )
         on delete cascade,
   primary key ( comment_id,
                 user_id )
);

create index if not exists idx_comments_suggestion on
   comments (
      suggestion_id
   );
create index if not exists idx_suggestions_status on
   suggestions (
      status
   );