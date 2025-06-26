-- database/supabase/migrations/20250625000001_initial_schema.sql

-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Set up Row Level Security
alter default privileges revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon;

-- Create custom types
create type user_role as enum ('user', 'admin', 'premium');
create type project_status as enum ('active', 'archived', 'deleted');
create type message_role as enum ('user', 'assistant', 'system');

-- Users table (extends Supabase auth.users)
create table public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  role user_role default 'user',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints
  constraint username_length check (char_length(username) >= 3),
  constraint username_format check (username ~* '^[a-zA-Z0-9_-]+$')
);

-- Create index for faster lookups
create index user_profiles_username_idx on public.user_profiles(username);
create index user_profiles_created_at_idx on public.user_profiles(created_at);

-- Function to automatically create user profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.user_profiles (id, full_name, avatar_url, username)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    coalesce(
      new.raw_user_meta_data->>'username',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

-- Trigger to create profile on user signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

-- Projects table
create table public.projects (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  project_path text,
  language text,
  framework text,
  status project_status default 'active',
  context_data jsonb default '{}'::jsonb,
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints
  constraint project_name_length check (char_length(name) >= 1 and char_length(name) <= 100),
  constraint project_description_length check (char_length(description) <= 1000)
);

-- Create indexes for projects
create index projects_user_id_idx on public.projects(user_id);
create index projects_status_idx on public.projects(status);
create index projects_created_at_idx on public.projects(created_at);
create index projects_language_idx on public.projects(language);

-- Add updated_at trigger to projects
create trigger projects_updated_at
  before update on public.projects
  for each row execute procedure public.handle_updated_at();

-- Chat sessions table
create table public.chat_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  title text not null default 'New Chat',
  settings jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints
  constraint session_title_length check (char_length(title) >= 1 and char_length(title) <= 200)
);

-- Create indexes for chat sessions
create index chat_sessions_user_id_idx on public.chat_sessions(user_id);
create index chat_sessions_project_id_idx on public.chat_sessions(project_id);
create index chat_sessions_updated_at_idx on public.chat_sessions(updated_at desc);

-- Add updated_at trigger to chat sessions
create trigger chat_sessions_updated_at
  before update on public.chat_sessions
  for each row execute procedure public.handle_updated_at();

-- Messages table
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  session_id uuid references public.chat_sessions(id) on delete cascade not null,
  role message_role not null,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints
  constraint message_content_length check (char_length(content) >= 1 and char_length(content) <= 100000)
);

-- Create indexes for messages
create index messages_session_id_idx on public.messages(session_id);
create index messages_created_at_idx on public.messages(created_at);
create index messages_role_idx on public.messages(role);

-- User preferences and learning data
create table public.user_preferences (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  preference_type text not null,
  preference_data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Unique constraint to prevent duplicate preference types per user
  unique(user_id, preference_type),
  
  -- Constraints
  constraint preference_type_length check (char_length(preference_type) >= 1 and char_length(preference_type) <= 100)
);

-- Create indexes for user preferences
create index user_preferences_user_id_idx on public.user_preferences(user_id);
create index user_preferences_type_idx on public.user_preferences(preference_type);

-- Add updated_at trigger to user preferences
create trigger user_preferences_updated_at
  before update on public.user_preferences
  for each row execute procedure public.handle_updated_at();

-- Learning events table (for AI improvement)
create table public.learning_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  session_id uuid references public.chat_sessions(id) on delete set null,
  event_type text not null,
  event_data jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraints
  constraint event_type_length check (char_length(event_type) >= 1 and char_length(event_type) <= 100)
);

-- Create indexes for learning events
create index learning_events_user_id_idx on public.learning_events(user_id);
create index learning_events_type_idx on public.learning_events(event_type);
create index learning_events_created_at_idx on public.learning_events(created_at desc);

-- Project files table (for file management)
create table public.project_files (
  id uuid default uuid_generate_v4() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  file_path text not null,
  file_name text not null,
  file_size bigint,
  mime_type text,
  content text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Unique constraint to prevent duplicate files per project
  unique(project_id, file_path),
  
  -- Constraints
  constraint file_path_length check (char_length(file_path) >= 1 and char_length(file_path) <= 1000),
  constraint file_name_length check (char_length(file_name) >= 1 and char_length(file_name) <= 255),
  constraint file_size_positive check (file_size >= 0)
);

-- Create indexes for project files
create index project_files_project_id_idx on public.project_files(project_id);
create index project_files_file_name_idx on public.project_files(file_name);
create index project_files_mime_type_idx on public.project_files(mime_type);

-- Add updated_at trigger to project files
create trigger project_files_updated_at
  before update on public.project_files
  for each row execute procedure public.handle_updated_at();

-- Enable Row Level Security on all tables
alter table public.user_profiles enable row level security;
alter table public.projects enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.messages enable row level security;
alter table public.user_preferences enable row level security;
alter table public.learning_events enable row level security;
alter table public.project_files enable row level security;

-- Create policies for user_profiles
create policy "Users can view their own profile" on public.user_profiles
  for select using (auth.uid() = id);

create policy "Users can update their own profile" on public.user_profiles
  for update using (auth.uid() = id);

create policy "Users can insert their own profile" on public.user_profiles
  for insert with check (auth.uid() = id);

-- Create policies for projects
create policy "Users can view their own projects" on public.projects
  for select using (auth.uid() = user_id);

create policy "Users can create their own projects" on public.projects
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own projects" on public.projects
  for update using (auth.uid() = user_id);

create policy "Users can delete their own projects" on public.projects
  for delete using (auth.uid() = user_id);

-- Create policies for chat_sessions
create policy "Users can view their own chat sessions" on public.chat_sessions
  for select using (auth.uid() = user_id);

create policy "Users can create their own chat sessions" on public.chat_sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own chat sessions" on public.chat_sessions
  for update using (auth.uid() = user_id);

create policy "Users can delete their own chat sessions" on public.chat_sessions
  for delete using (auth.uid() = user_id);

-- Create policies for messages
create policy "Users can view messages from their sessions" on public.messages
  for select using (
    exists (
      select 1 from public.chat_sessions
      where chat_sessions.id = messages.session_id
      and chat_sessions.user_id = auth.uid()
    )
  );

create policy "Users can create messages in their sessions" on public.messages
  for insert with check (
    exists (
      select 1 from public.chat_sessions
      where chat_sessions.id = messages.session_id
      and chat_sessions.user_id = auth.uid()
    )
  );

-- Create policies for user_preferences
create policy "Users can manage their own preferences" on public.user_preferences
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Create policies for learning_events
create policy "Users can view their own learning events" on public.learning_events
  for select using (auth.uid() = user_id);

create policy "System can create learning events" on public.learning_events
  for insert with check (auth.uid() = user_id);

-- Create policies for project_files
create policy "Users can manage files in their projects" on public.project_files
  for all using (
    exists (
      select 1 from public.projects
      where projects.id = project_files.project_id
      and projects.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.projects
      where projects.id = project_files.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Allow public insert for demo
create policy "Allow public insert for demo"
  on public.projects
  for insert
  using (true)
  with check (true);