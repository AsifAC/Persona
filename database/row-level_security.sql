-- Check RLS Status for All Tables
-- This script shows you the current state of RLS policies
-- Run this in your Supabase SQL Editor to see what policies exist

-- Check if RLS is enabled on tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('person_profiles', 'addresses', 'phone_numbers', 'social_media', 'criminal_records', 'relatives')
ORDER BY tablename;

-- Check all existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as command,
    qual as using_expression,
    with_check
FROM pg_policies 
WHERE tablename IN ('person_profiles', 'addresses', 'phone_numbers', 'social_media', 'criminal_records', 'relatives')
ORDER BY tablename, cmd, policyname;

-- Test auth.uid() function (should return your user ID if authenticated)
SELECT 
    auth.uid() as current_user_id,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ User authenticated'
        ELSE '❌ No user authenticated'
    END as auth_status;

