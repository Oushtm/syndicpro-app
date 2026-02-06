
-- 1. Users Table (Public Profiles)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text default 'viewer', -- 'admin', 'viewer'
  display_name text,
  permissions jsonb default '{}'::jsonb, -- Stores { canView: true, canModify: false, ... }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

create policy "Admins can update profiles" on public.profiles
  for update using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete profiles" on public.profiles
  for delete using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and role = 'admin'
    )
  );

-- 2. Apartments Table
create table public.apartments (
  id uuid default gen_random_uuid() primary key,
  number text not null,
  floor integer not null,
  resident_name text,
  status text default 'occupied', -- 'occupied', 'vacant'
  balance numeric default 0,
  email text,
  phone text,
  resident_cin text,
  occupancy_type text default 'owner',
  roommate_count integer default 1,
  roommates_data jsonb default '[]'::jsonb,
  monthly_total numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.apartments enable row level security;

create policy "Allow read access for authenticated users" on public.apartments
  for select using (auth.role() = 'authenticated');

create policy "Allow all access for admins" on public.apartments
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and role = 'admin'
    )
  );

-- 3. Payments Table
create table public.payments (
  id uuid default gen_random_uuid() primary key,
  apartment_id uuid references public.apartments not null,
  amount numeric not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  month integer, -- 1-12
  year integer,
  status text default 'UNPAID',
  paid_at timestamp with time zone,
  reference_number text,
  created_by uuid references auth.users,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  UNIQUE(apartment_id, month, year)
);

alter table public.payments enable row level security;

create policy "Allow read access for authenticated users" on public.payments
  for select using (auth.role() = 'authenticated');

create policy "Allow all access for admins" on public.payments
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and role = 'admin'
    )
  );

-- 4. Expenses Table
create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  amount numeric not null,
  category text, -- 'MAINTENANCE', 'UTILITIES', etc.
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  description text,
  created_by uuid references auth.users,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.expenses enable row level security;

create policy "Allow read access for authenticated users" on public.expenses
  for select using (auth.role() = 'authenticated');

create policy "Allow all access for admins" on public.expenses
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and role = 'admin'
    )
  );

-- 5. Settings Table
create table public.settings (
  id text primary key, -- e.g. 'app'
  building_name text,
  building_address text,
  default_monthly_fee numeric,
  currency text default 'DH',
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  updated_by text
);

alter table public.settings enable row level security;

create policy "Allow read access for authenticated users" on public.settings
  for select using (auth.role() = 'authenticated');

create policy "Allow all access for admins" on public.settings
  for all using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and role = 'admin'
    )
  );

-- Seed default settings
insert into public.settings (id, building_name, default_monthly_fee, currency)
values ('app', 'SyndicPro', 200, 'DH')
on conflict (id) do nothing;
