-- Enable extensions (UUID and Timestamp helpers)
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Users will be managed via Supabase Auth, no separate table needed

-- Employees Table
create table employees (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text unique not null,
  phone text,
  role text, -- e.g. Manager, Developer
  department text,
  join_date date,
  image_url text,
  created_at timestamp default now()
);

-- Departments Table (optional, for better normalization)
create table departments (
  id uuid primary key default uuid_generate_v4(),
  name text unique not null
);

-- Enable RLS
alter table employees enable row level security;

-- Policies (Example: Admin has full access, employee sees their own record)
create policy "Allow all for admins"
  on employees
  for all
  using (auth.role() = 'authenticated');

-- (You can customize with more restrictive rules per your app logic)
