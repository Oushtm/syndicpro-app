
-- 1. Function to handle new user profile creation
-- This trigger automatically creates a profile when a user signs up or is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role, permissions)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'display_name', 
    COALESCE(new.raw_user_meta_data->>'role', 'viewer'),
    COALESCE((new.raw_user_meta_data->>'permissions')::jsonb, '{}'::jsonb)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Master Function for Admin to Create Users
-- This function allows an admin to create a user in auth.users
CREATE OR REPLACE FUNCTION public.create_user_admin(
  email text,
  password text,
  display_name text,
  user_role text,
  user_permissions jsonb
)
RETURNS uuid AS $$
DECLARE
  new_user_id uuid;
  is_admin boolean;
BEGIN
  -- CHECK: Is the caller an admin?
  SELECT (role = 'admin' OR permissions->>'canManageUsers' = 'true') INTO is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can create new users.';
  END IF;

  -- Verify email doesn't exist to provide a better error
  IF EXISTS (SELECT 1 FROM auth.users WHERE auth.users.email = create_user_admin.email) THEN
    RAISE EXCEPTION 'This email is already registered in the system.';
  END IF;

  -- Create the user in auth.users
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    email,
    crypt(password, gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    jsonb_build_object(
        'display_name', display_name,
        'role', user_role,
        'permissions', user_permissions
    ),
    now(),
    now(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Master Function for Admin to Delete Users
-- This function fully removes a user from both Profiles and Auth
CREATE OR REPLACE FUNCTION public.delete_user_admin(target_user_id uuid)
RETURNS void AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- CHECK: Is the caller an admin?
  SELECT (role = 'admin' OR permissions->>'canManageUsers' = 'true') INTO is_admin
  FROM public.profiles
  WHERE id = auth.uid();

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can delete users.';
  END IF;

  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot delete your own account.';
  END IF;

  -- Delete from auth.users (cascades to public.profiles if foreign key is set correctly, 
  -- but we manually delete profile first just in case of RLS/Trigger issues)
  DELETE FROM public.profiles WHERE id = target_user_id;
  DELETE FROM auth.users WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Grant permissions to execute the functions
GRANT EXECUTE ON FUNCTION public.create_user_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_user_admin TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_admin TO service_role;
GRANT EXECUTE ON FUNCTION public.delete_user_admin TO service_role;
