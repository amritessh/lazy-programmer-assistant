-- database/supabase/migrations/20250625000002_seed_data.sql

-- Insert default user preference types
insert into public.user_preferences (id, user_id, preference_type, preference_data)
select 
  uuid_generate_v4(),
  auth.uid(),
  'ai_personality',
  '{
    "sassLevel": 5,
    "verbosity": "detailed",
    "explanationStyle": "casual"
  }'::jsonb
where auth.uid() is not null
on conflict (user_id, preference_type) do nothing;

-- Create a function to set default preferences for new users
create or replace function public.create_default_user_preferences(user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- AI Personality preferences
  insert into public.user_preferences (user_id, preference_type, preference_data)
  values (
    user_id,
    'ai_personality',
    '{
      "sassLevel": 5,
      "verbosity": "detailed",
      "explanationStyle": "casual"
    }'::jsonb
  ) on conflict (user_id, preference_type) do nothing;

  -- Coding style preferences
  insert into public.user_preferences (user_id, preference_type, preference_data)
  values (
    user_id,
    'coding_style',
    '{
      "indentation": "spaces",
      "semicolons": true,
      "quotes": "single",
      "trailingCommas": true
    }'::jsonb
  ) on conflict (user_id, preference_type) do nothing;

  -- Interface preferences
  insert into public.user_preferences (user_id, preference_type, preference_data)
  values (
    user_id,
    'interface',
    '{
      "theme": "dark",
      "fontSize": "medium",
      "animations": true,
      "notifications": true
    }'::jsonb
  ) on conflict (user_id, preference_type) do nothing;

  -- Voice preferences
  insert into public.user_preferences (user_id, preference_type, preference_data)
  values (
    user_id,
    'voice',
    '{
      "enabled": true,
      "language": "en-US",
      "autoStart": false,
      "confidenceThreshold": 0.8
    }'::jsonb
  ) on conflict (user_id, preference_type) do nothing;
end;
$$;

-- Update the handle_new_user function to create default preferences
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Create user profile
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

  -- Create default preferences
  perform public.create_default_user_preferences(new.id);

  return new;
end;
$$;

-- Create some sample vague phrases for the AI training
create table public.vague_phrases (
  id uuid default uuid_generate_v4() primary key,
  phrase text not null,
  category text not null,
  interpretation text not null,
  confidence_score float default 0.8,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insert sample vague phrases
insert into public.vague_phrases (phrase, category, interpretation, confidence_score) values
  ('make the thing work', 'general', 'Implement or fix the primary functionality', 0.9),
  ('fix the broken stuff', 'debugging', 'Debug and resolve errors in the codebase', 0.9),
  ('add a button', 'ui', 'Create a new button UI component with appropriate styling', 0.8),
  ('make it pretty', 'styling', 'Improve the visual design and styling', 0.7),
  ('add the clicky thing', 'ui', 'Add an interactive element (button, link, or clickable component)', 0.8),
  ('do the thing', 'general', 'Implement the most logical next step based on context', 0.6),
  ('handle the data', 'data', 'Process, validate, or manipulate data appropriately', 0.7),
  ('make it responsive', 'styling', 'Add responsive design for mobile and desktop', 0.9),
  ('add error handling', 'debugging', 'Implement proper error handling and validation', 0.9),
  ('optimize this', 'performance', 'Improve performance and efficiency', 0.8),
  ('refactor it', 'code_quality', 'Improve code structure and maintainability', 0.8),
  ('add tests', 'testing', 'Create unit tests for the functionality', 0.9),
  ('make it faster', 'performance', 'Optimize for better performance', 0.8),
  ('clean it up', 'code_quality', 'Improve code readability and remove unused code', 0.7),
  ('add validation', 'data', 'Add input validation and sanitization', 0.9),
  ('make it secure', 'security', 'Implement security best practices', 0.8),
  ('add logging', 'debugging', 'Add proper logging for debugging and monitoring', 0.8),
  ('handle edge cases', 'debugging', 'Add handling for edge cases and error scenarios', 0.8),
  ('add documentation', 'documentation', 'Add code comments and documentation', 0.9),
  ('make it modular', 'code_quality', 'Break code into reusable modules or components', 0.8);

-- Create indexes for vague phrases
create index vague_phrases_category_idx on public.vague_phrases(category);
create index vague_phrases_confidence_idx on public.vague_phrases(confidence_score desc);

-- Create a function to get random vague phrase suggestions
create or replace function public.get_random_suggestions(limit_count integer default 5)
returns table(phrase text, category text)
language plpgsql
as $$
begin
  return query
  select vp.phrase, vp.category
  from public.vague_phrases vp
  order by random()
  limit limit_count;
end;
$$;

-- Create a function to search for similar phrases
create or replace function public.search_similar_phrases(input_phrase text, limit_count integer default 5)
returns table(phrase text, category text, interpretation text, confidence_score float)
language plpgsql
as $$
begin
  return query
  select vp.phrase, vp.category, vp.interpretation, vp.confidence_score
  from public.vague_phrases vp
  where vp.phrase ilike '%' || input_phrase || '%'
     or vp.interpretation ilike '%' || input_phrase || '%'
  order by vp.confidence_score desc
  limit limit_count;
end;
$$;

-- Create a function to log user interactions for learning
create or replace function public.log_user_interaction(
  p_user_id uuid,
  p_session_id uuid,
  p_event_type text,
  p_event_data jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  event_id uuid;
begin
  insert into public.learning_events (user_id, session_id, event_type, event_data)
  values (p_user_id, p_session_id, p_event_type, p_event_data)
  returning id into event_id;
  
  return event_id;
end;
$$;

-- Create a view for user activity statistics
create or replace view public.user_activity_stats as
select 
  u.id as user_id,
  u.username,
  u.created_at as user_created_at,
  count(distinct p.id) as total_projects,
  count(distinct cs.id) as total_chat_sessions,
  count(distinct m.id) as total_messages,
  count(distinct le.id) as total_learning_events,
  max(cs.updated_at) as last_chat_activity,
  max(le.created_at) as last_learning_event
from public.user_profiles u
left join public.projects p on u.id = p.user_id
left join public.chat_sessions cs on u.id = cs.user_id
left join public.messages m on cs.id = m.session_id
left join public.learning_events le on u.id = le.user_id
group by u.id, u.username, u.created_at;

-- Create a function to get user's favorite phrases
create or replace function public.get_user_favorite_phrases(p_user_id uuid, limit_count integer default 10)
returns table(phrase text, usage_count bigint, last_used timestamp with time zone)
language plpgsql
as $$
begin
  return query
  select 
    (le.event_data->>'phrase')::text as phrase,
    count(*) as usage_count,
    max(le.created_at) as last_used
  from public.learning_events le
  where le.user_id = p_user_id
    and le.event_type = 'vague_request'
    and le.event_data ? 'phrase'
  group by le.event_data->>'phrase'
  order by usage_count desc, last_used desc
  limit limit_count;
end;
$$;

-- Grant necessary permissions for the functions
grant execute on function public.create_default_user_preferences(uuid) to authenticated;
grant execute on function public.get_random_suggestions(integer) to authenticated;
grant execute on function public.search_similar_phrases(text, integer) to authenticated;
grant execute on function public.log_user_interaction(uuid, uuid, text, jsonb) to authenticated;
grant execute on function public.get_user_favorite_phrases(uuid, integer) to authenticated;

-- Grant read access to vague_phrases for authenticated users
grant select on public.vague_phrases to authenticated;
grant select on public.user_activity_stats to authenticated;