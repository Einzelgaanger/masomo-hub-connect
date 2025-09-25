-- Create follows table
create table if not exists public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id)
);

alter table public.follows enable row level security;

-- Policies
do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='follows' and policyname='Users can view follows in their university'
  ) then
    create policy "Users can view follows in their university" on public.follows
    for select to authenticated
    using (
      exists (
        select 1
        from public.profiles p1
        join public.classes c1 on p1.class_id = c1.id
        join public.profiles p2 on p2.user_id = follows.following_id
        join public.classes c2 on p2.class_id = c2.id
        where p1.user_id = auth.uid() and c1.university_id = c2.university_id
      )
    );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='follows' and policyname='Users can follow others'
  ) then
    create policy "Users can follow others" on public.follows
    for insert to authenticated
    with check (follower_id = auth.uid());
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='follows' and policyname='Users can unfollow'
  ) then
    create policy "Users can unfollow" on public.follows
    for delete to authenticated
    using (follower_id = auth.uid());
  end if;
end $$;


