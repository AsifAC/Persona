-- Fix Row Level Security for person_profiles - Simplified Version
-- ============================================
-- Person Profiles Policies (Simplified)
-- ============================================
DROP POLICY IF EXISTS "Users can insert person profiles" ON public.person_profiles;
DROP POLICY IF EXISTS "Users can update person profiles" ON public.person_profiles;

CREATE POLICY "Users can insert person profiles" ON public.person_profiles
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update person profiles" ON public.person_profiles
    FOR UPDATE
    USING (auth.uid() IS NOT NULL);

-- ============================================
-- Related Tables - INSERT Policies (Simplified)
-- ============================================

-- Addresses
DROP POLICY IF EXISTS "Users can insert addresses" ON public.addresses;
CREATE POLICY "Users can insert addresses" ON public.addresses
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Phone Numbers
DROP POLICY IF EXISTS "Users can insert phone numbers" ON public.phone_numbers;
CREATE POLICY "Users can insert phone numbers" ON public.phone_numbers
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Social Media
DROP POLICY IF EXISTS "Users can insert social media" ON public.social_media;
CREATE POLICY "Users can insert social media" ON public.social_media
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Criminal Records
DROP POLICY IF EXISTS "Users can insert criminal records" ON public.criminal_records;
CREATE POLICY "Users can insert criminal records" ON public.criminal_records
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Relatives
DROP POLICY IF EXISTS "Users can insert relatives" ON public.relatives;
CREATE POLICY "Users can insert relatives" ON public.relatives
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Allow users to delete their own search history
DROP POLICY IF EXISTS "Users can delete own search history"
ON public.search_history;

CREATE POLICY "Users can delete own search history"
ON public.search_history
FOR DELETE
USING (auth.uid() = user_id);

--  ==TEST==
--   select tablename, policyname, cmd, roles, qual, with_check
--   from pg_policies
--   where tablename in ('person_profiles','addresses','phone_numbers','social_media','criminal_records','relatives')
--   order by tablename, cmd, policyname;

--   select tablename, policyname, permissive, roles, cmd, qual, with_check
--   from pg_policies
--   where tablename in ('person_profiles','addresses','phone_numbers','social_media','criminal_records','relatives')
--   order by tablename, cmd, policyname;

--   select relname, relrowsecurity, relforcerowsecurity
--   from pg_class
--   where relname in ('person_profiles','addresses','phone_numbers','social_media','criminal_records','relatives');

select tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where tablename in ('person_profiles','addresses','phone_numbers','social_media','criminal_records','relatives')
order by tablename, cmd, policyname;
