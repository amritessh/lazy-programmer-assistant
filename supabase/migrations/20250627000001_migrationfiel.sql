-- Allow public insert for demo
create policy "Allow public insert for demo"
  on public.projects
  for insert
  with check (true); 