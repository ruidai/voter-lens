-- Add stance paragraph to profiles table
alter table public.profiles 
  add column if not exists stance_paragraph text;

-- Create Voter Responses table to save stances programmatically
create table if not exists public.voter_responses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  question_id text not null,
  selected_answer text,
  free_text_answer text,
  answered_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, question_id) -- Ensure one response per question per user
);

-- Enable RLS for voter_responses
alter table public.voter_responses enable row level security;

-- Voter Responses RLS Policies
create policy "Allow users to view their own responses"
  on public.voter_responses for select
  using (auth.uid() = user_id);

create policy "Allow users to insert their own responses"
  on public.voter_responses for insert
  with check (auth.uid() = user_id);

create policy "Allow users to update their own responses"
  on public.voter_responses for update
  using (auth.uid() = user_id);

create policy "Allow users to delete their own responses"
  on public.voter_responses for delete
  using (auth.uid() = user_id);
