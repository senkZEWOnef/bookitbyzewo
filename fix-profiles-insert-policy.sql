-- Add missing INSERT policy for profiles table
create policy "users can create own profile" on profiles
  for insert with check (id = auth.uid());