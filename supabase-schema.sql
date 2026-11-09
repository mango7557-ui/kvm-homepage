-- Run once in the Supabase SQL editor. Roles are never stored in editable user metadata.
begin;
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 80),
  email text not null,
  created_at timestamptz not null default now()
);
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_users where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;
create or replace function public.create_member_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,full_name,email)
  values(new.id,left(coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'),''),'회원'),80),coalesce(new.email,''));
  return new;
end;
$$;
revoke all on function public.create_member_profile() from public;
create trigger on_kvm_member_created after insert on auth.users for each row execute function public.create_member_profile();
create table public.consultations (
  id uuid primary key default gen_random_uuid(),
  name text not null check(char_length(trim(name)) between 1 and 80),
  phone text not null check(char_length(trim(phone)) between 7 and 24),
  income text not null default '' check(char_length(income)<=100),
  interest text not null default '' check(char_length(interest)<=100),
  message text not null default '' check(char_length(message)<=3000),
  consent boolean not null check(consent = true),
  status text not null default 'new' check(status in ('new','progress','done')),
  created_at timestamptz not null default now()
);
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  email text not null check(char_length(email) between 3 and 254 and email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  created_at timestamptz not null default now()
);
create index consultations_created on public.consultations(created_at desc);
create index consultations_status on public.consultations(status);
alter table public.profiles enable row level security;
alter table public.admin_users enable row level security;
alter table public.consultations enable row level security;
alter table public.subscriptions enable row level security;
revoke all on public.profiles,public.admin_users,public.consultations,public.subscriptions from anon,authenticated;
grant select on public.profiles to authenticated;
grant update(full_name) on public.profiles to authenticated;
create policy profile_read on public.profiles for select to authenticated using(id=auth.uid() or public.is_admin());
create policy profile_edit on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());
grant insert(name,phone,income,interest,message,consent) on public.consultations to anon,authenticated;
grant select on public.consultations to authenticated;
grant update(status) on public.consultations to authenticated;
create policy consult_submit on public.consultations for insert to anon,authenticated with check(status='new' and consent=true);
create policy consult_admin_read on public.consultations for select to authenticated using(public.is_admin());
create policy consult_admin_update on public.consultations for update to authenticated using(public.is_admin()) with check(public.is_admin());
grant insert(email) on public.subscriptions to anon,authenticated;
grant select on public.subscriptions to authenticated;
create policy subscription_submit on public.subscriptions for insert to anon,authenticated with check(true);
create policy subscription_admin_read on public.subscriptions for select to authenticated using(public.is_admin());
commit;
