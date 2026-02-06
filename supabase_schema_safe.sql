-- Safe Migration Script for Supabase
-- This script uses DROP IF EXISTS and CREATE OR REPLACE to handle existing tables

-- 1. Drop existing tables (in reverse dependency order)
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.apartments CASCADE;
DROP TABLE IF EXISTS public.settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Users Table (Public Profiles)
CREATE TABLE public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  role text default 'viewer', -- 'admin', 'viewer'
  display_name text,
  permissions jsonb default '{}'::jsonb, -- Stores { canView: true, canModify: false, ... }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete profiles" ON public.profiles
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND role = 'admin'
    )
  );

-- 3. Apartments Table
CREATE TABLE public.apartments (
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

ALTER TABLE public.apartments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users" ON public.apartments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow write access for admins and editors" ON public.apartments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- 4. Payments Table
CREATE TABLE public.payments (
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

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users" ON public.payments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow write access for admins and editors" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- 5. Expenses Table
CREATE TABLE public.expenses (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  amount numeric not null,
  category text, -- 'MAINTENANCE', 'UTILITIES', etc.
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  description text,
  created_by uuid references auth.users,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users" ON public.expenses
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow write access for admins and editors" ON public.expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- 6. Settings Table
CREATE TABLE public.settings (
  id text primary key, -- e.g. 'app'
  building_name text,
  building_address text,
  default_monthly_fee numeric,
  currency text default 'DH',
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  updated_by text
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for authenticated users" ON public.settings
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all access for admins" ON public.settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND role = 'admin'
    )
  );

-- Seed default settings
INSERT INTO public.settings (id, building_name, default_monthly_fee, currency)
VALUES ('app', 'SyndicPro', 200, 'DH')
ON CONFLICT (id) DO NOTHING;
