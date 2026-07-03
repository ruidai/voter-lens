-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Profiles Table (Linked to Supabase Auth users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  voter_status text default 'unverified', -- e.g., verified, unverified, pending
  zip_code text,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Profiles
alter table public.profiles enable row level security;

-- Profiles Policies
create policy "Allow users to view their own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Allow users to update their own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

-- Trigger to automatically create a profile for new auth users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, voter_status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    'unverified'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Create User Preferences Table
create table public.user_preferences (
  id uuid references public.profiles(id) on delete cascade primary key,
  education_priority text check (education_priority in ('high', 'medium', 'low', 'none')),
  fiscal_priority text check (fiscal_priority in ('high', 'medium', 'low', 'none')),
  governance_priority text check (governance_priority in ('high', 'medium', 'low', 'none')),
  custom_notes text,
  raw_preferences jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for User Preferences
alter table public.user_preferences enable row level security;

-- User Preferences Policies
create policy "Allow users to view their own preferences" 
  on public.user_preferences for select 
  using (auth.uid() = id);

create policy "Allow users to insert their own preferences" 
  on public.user_preferences for insert 
  with check (auth.uid() = id);

create policy "Allow users to update their own preferences" 
  on public.user_preferences for update 
  using (auth.uid() = id);


-- 3. Create Ingested Documents Table (OCR materials)
create table public.ingested_documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  ocr_text text,
  file_url text,
  metadata jsonb default '{}'::jsonb, -- holds structured candidate/prop data
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for Ingested Documents
alter table public.ingested_documents enable row level security;

-- Ingested Documents Policies
create policy "Allow users to view their own documents" 
  on public.ingested_documents for select 
  using (auth.uid() = user_id);

create policy "Allow users to insert their own documents" 
  on public.ingested_documents for insert 
  with check (auth.uid() = user_id);

create policy "Allow users to delete their own documents" 
  on public.ingested_documents for delete 
  using (auth.uid() = user_id);
