-- Allow authenticated user to create own profile row if trigger missed
DROP POLICY IF EXISTS "users_insert_self" ON users;
CREATE POLICY "users_insert_self" ON users FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
