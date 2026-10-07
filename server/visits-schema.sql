-- kimportflowrio visits: isolated from student-grade-system application tables.
-- This is the reviewed setup SQL, not a generated local migration-history file.
begin;

create schema if not exists portfolio_visits;
revoke all on schema portfolio_visits from public, anon, authenticated;
grant usage on schema portfolio_visits to service_role;

create table if not exists portfolio_visits.visitors (
  visitor_key text primary key check (visitor_key ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists portfolio_visits_recent_idx
  on portfolio_visits.visitors (created_at desc, visitor_key);
alter table portfolio_visits.visitors enable row level security;
revoke all on table portfolio_visits.visitors from public, anon, authenticated, service_role;
grant select, insert on table portfolio_visits.visitors to service_role;

create or replace function public.kimportflowrio_visit_snapshot()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'total', (select count(*) from portfolio_visits.visitors),
    'avatars', coalesce((
      select jsonb_agg(recent.seed order by recent.created_at desc, recent.visitor_key)
      from (
        select substr(visitor_key, 1, 8) as seed, created_at, visitor_key
        from portfolio_visits.visitors
        order by created_at desc, visitor_key
        limit 4
      ) recent
    ), '[]'::jsonb)
  );
$$;

create or replace function public.kimportflowrio_record_visit(visitor_key text)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if visitor_key is null or visitor_key !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid visitor key' using errcode = '22023';
  end if;
  insert into portfolio_visits.visitors (visitor_key)
  values (kimportflowrio_record_visit.visitor_key)
  on conflict on constraint visitors_pkey do nothing;
  return public.kimportflowrio_visit_snapshot();
end;
$$;

revoke all on function public.kimportflowrio_visit_snapshot() from public, anon, authenticated;
revoke all on function public.kimportflowrio_record_visit(text) from public, anon, authenticated;
grant execute on function public.kimportflowrio_visit_snapshot() to service_role;
grant execute on function public.kimportflowrio_record_visit(text) to service_role;

comment on table portfolio_visits.visitors is 'Unique anonymous browser hashes for kimportflowrio. No synthetic visits, raw UUIDs, IP addresses, or contact data.';
notify pgrst, 'reload schema';
commit;
