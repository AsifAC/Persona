-- Fix Row Level Security for person_profiles and related tables
-- This allows authenticated users to insert and update person profiles
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- ============================================
-- Person Profiles Policies
-- ============================================

-- Allow authenticated users to insert person profiles
-- This is needed when creating search results
DROP POLICY IF EXISTS "Users can insert person profiles" ON public.person_profiles;
CREATE POLICY "Users can insert person profiles" ON public.person_profiles
    FOR INSERT 
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Allow authenticated users to update person profiles
-- This is needed when updating existing profiles with new data
DROP POLICY IF EXISTS "Users can update person profiles" ON public.person_profiles;
CREATE POLICY "Users can update person profiles" ON public.person_profiles
    FOR UPDATE 
    USING ((select auth.uid()) IS NOT NULL);

-- ============================================
-- Related Tables - INSERT Policies
-- ============================================

-- Addresses
DROP POLICY IF EXISTS "Users can insert addresses" ON public.addresses;
CREATE POLICY "Users can insert addresses" ON public.addresses
    FOR INSERT 
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Phone Numbers
DROP POLICY IF EXISTS "Users can insert phone numbers" ON public.phone_numbers;
CREATE POLICY "Users can insert phone numbers" ON public.phone_numbers
    FOR INSERT 
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Social Media
DROP POLICY IF EXISTS "Users can insert social media" ON public.social_media;
CREATE POLICY "Users can insert social media" ON public.social_media
    FOR INSERT 
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Criminal Records
DROP POLICY IF EXISTS "Users can insert criminal records" ON public.criminal_records;
CREATE POLICY "Users can insert criminal records" ON public.criminal_records
    FOR INSERT 
    WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Relatives
DROP POLICY IF EXISTS "Users can insert relatives" ON public.relatives;
CREATE POLICY "Users can insert relatives" ON public.relatives
    FOR INSERT 
    WITH CHECK ((select auth.uid()) IS NOT NULL);

