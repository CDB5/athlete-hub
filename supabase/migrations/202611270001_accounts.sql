-- Athlete Hub: voer uit in een eigen Supabase-project, als projectbeheerder.
-- Wachtwoorden worden uitsluitend door Supabase Auth beheerd.
begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy profiles_read_own on public.profiles for select to authenticated
  using (id = (select auth.uid()));
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant all on public.profiles to service_role;

create function public.handle_athlete_signup() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, username)
  values (new.id, lower(btrim(new.raw_user_meta_data ->> 'username')));
  return new;
end;
$$;
revoke all on function public.handle_athlete_signup() from public, anon, authenticated;
create trigger athlete_signup after insert on auth.users
  for each row execute function public.handle_athlete_signup();

-- Eén rij per product, maaltijd, set, meting, instelling enzovoort.
-- De samengestelde primaire sleutel houdt gebruikers en losse items gescheiden.
create table public.athlete_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  collection text not null check (collection in (
    'meta','done','test','event','meal','set','note','goal','body','profile',
    'recipe','exercise','checkin','wearable','adjustment','freeTest','timeMode','product'
  )),
  scope text not null default '' check (length(scope) <= 120),
  id text not null check (length(id) between 1 and 160),
  value jsonb,
  item_order double precision,
  deleted boolean not null default false,
  version uuid not null default gen_random_uuid(),
  mutation_id uuid not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, collection, scope, id),
  check (deleted or value is not null),
  check (value is null or octet_length(value::text) <= 65536)
);
alter table public.athlete_records enable row level security;
create policy records_read_own on public.athlete_records for select to authenticated
  using (user_id = (select auth.uid()));
create policy records_insert_own on public.athlete_records for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy records_update_own on public.athlete_records for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.athlete_records from anon, authenticated;
grant select, insert, update on public.athlete_records to authenticated;
grant all on public.athlete_records to service_role;

-- Optimistische vergrendeling: een gewijzigde rij overschrijft nooit stilzwijgend
-- de nieuwere versie van een ander toestel. Verwijderingen blijven als tombstone.
create function public.apply_athlete_changes(changes jsonb) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  change jsonb;
  previous public.athlete_records;
  saved public.athlete_records;
  result jsonb := '[]'::jsonb;
  owner_id uuid := auth.uid();
  expected uuid;
  token uuid;
begin
  if owner_id is null then raise exception 'Authentication required' using errcode = '42501'; end if;
  if jsonb_typeof(changes) <> 'array' or jsonb_array_length(changes) > 250 then
    raise exception 'Invalid batch';
  end if;
  for change in select v from jsonb_array_elements(changes) v
    order by v->>'collection', coalesce(v->>'scope',''), v->>'id'
  loop
    if change->>'id' is null or change->>'collection' is null then raise exception 'Invalid key'; end if;
    token := (change->>'mutationId')::uuid;
    if token is null then raise exception 'Mutation ID required'; end if;
    expected := (change->>'baseVersion')::uuid;
    perform pg_advisory_xact_lock(hashtextextended(
      jsonb_build_array(owner_id,change->>'collection',coalesce(change->>'scope',''),change->>'id')::text,0));
    select * into previous from public.athlete_records
      where user_id=owner_id and collection=change->>'collection'
        and scope=coalesce(change->>'scope','') and id=change->>'id' for update;
    if previous.mutation_id = token then
      result := result || jsonb_build_array(jsonb_build_object('status','saved','record',to_jsonb(previous)));
    elsif previous.version is distinct from expected then
      result := result || jsonb_build_array(jsonb_build_object('status','conflict','record',case when previous.version is null then null else to_jsonb(previous) end,
        'key',jsonb_build_array(change->>'collection',coalesce(change->>'scope',''),change->>'id')));
    else
      insert into public.athlete_records(user_id,collection,scope,id,value,item_order,deleted,version,mutation_id,updated_at)
      values (owner_id,change->>'collection',coalesce(change->>'scope',''),change->>'id',
        case when coalesce((change->>'deleted')::boolean,false) then null else change->'value' end,
        (change->>'order')::double precision,coalesce((change->>'deleted')::boolean,false),gen_random_uuid(),token,now())
      on conflict (user_id,collection,scope,id) do update set
        value=excluded.value,item_order=excluded.item_order,deleted=excluded.deleted,
        version=excluded.version,mutation_id=excluded.mutation_id,updated_at=excluded.updated_at
      returning * into saved;
      result := result || jsonb_build_array(jsonb_build_object('status','saved','record',to_jsonb(saved)));
    end if;
  end loop;
  return result;
end;
$$;
revoke all on function public.apply_athlete_changes(jsonb) from public, anon;
grant execute on function public.apply_athlete_changes(jsonb) to authenticated;

-- SQL-weergaven maken JSONB-velden direct bruikbaar voor SELECT, SUM en JOIN.
-- security_invoker zorgt dat de onderliggende toegangsregels blijven gelden.
create view public.my_products with (security_invoker = true) as
  select user_id,id,value->>'name' as name,value->>'brand' as brand,
    (value->>'kcal')::numeric as kcal_per_100,(value->>'p')::numeric as protein_per_100,value
  from public.athlete_records where collection='product' and not deleted;
create view public.my_meals with (security_invoker = true) as
  select user_id,scope as day,id,value->>'name' as name,(value->>'amount')::numeric as amount,
    case when value->>'basis'='100' then (value->>'amount')::numeric/100 else 1 end *
      (value->>'kcal')::numeric as kcal,
    case when value->>'basis'='100' then (value->>'amount')::numeric/100 else 1 end *
      (value->>'p')::numeric as protein,value
  from public.athlete_records where collection='meal' and not deleted;
create view public.my_training_sets with (security_invoker = true) as
  select user_id,scope as day,id,value->>'exercise' as exercise,value->>'session' as session,
    (value->>'amount')::numeric as amount,(value->>'load')::numeric as load,value
  from public.athlete_records where collection='set' and not deleted;
revoke all on public.my_products, public.my_meals, public.my_training_sets from anon;
grant select on public.my_products, public.my_meals, public.my_training_sets to authenticated;

-- Deze tabel en hulpfuncties zijn uitsluitend voor de serverfunctie voor
-- aanmelden met een gebruikersnaam. E-mailadressen worden niet publiek opgezocht.
create table public.athlete_login_limits (
  bucket text primary key,
  window_start timestamptz not null,
  attempts integer not null
);
alter table public.athlete_login_limits enable row level security;
revoke all on public.athlete_login_limits from anon, authenticated;
grant all on public.athlete_login_limits to service_role;
create function public.consume_athlete_login(bucket_key text, max_attempts integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  if length(bucket_key) <> 64 or max_attempts not between 1 and 100 then raise exception 'Invalid bucket'; end if;
  insert into public.athlete_login_limits(bucket,window_start,attempts) values(bucket_key,now(),1)
  on conflict (bucket) do update set
    attempts=case when athlete_login_limits.window_start < now()-interval '15 minutes' then 1 else athlete_login_limits.attempts+1 end,
    window_start=case when athlete_login_limits.window_start < now()-interval '15 minutes' then now() else athlete_login_limits.window_start end
  returning attempts into n;
  delete from public.athlete_login_limits where window_start < now()-interval '1 day';
  return n <= max_attempts;
end;
$$;
create function public.athlete_login_email(login_username text) returns text
language sql stable security definer set search_path = '' as $$
  select u.email::text from auth.users u join public.profiles p on p.id=u.id
    where p.username=lower(btrim(login_username));
$$;
revoke all on function public.consume_athlete_login(text,integer) from public, anon, authenticated;
revoke all on function public.athlete_login_email(text) from public, anon, authenticated;
grant execute on function public.consume_athlete_login(text,integer), public.athlete_login_email(text) to service_role;
commit;
