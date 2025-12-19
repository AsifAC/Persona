-- Migration: Fix Security and Performance Issues
-- Run this in Supabase SQL Editor after the initial schema

-- ============================================
-- 1. SECURITY FIX: Function Search Path
-- ============================================
-- Fix the mutable search_path security issue
ALTER FUNCTION public.handle_new_user() 
SET search_path = public, pg_temp;

-- ============================================
-- 2. PERFORMANCE FIX: Missing Foreign Key Indexes
-- ============================================
-- Add indexes for foreign keys that are missing
CREATE INDEX IF NOT EXISTS idx_favorite_searches_search_query_id 
ON public.favorite_searches(search_query_id);

CREATE INDEX IF NOT EXISTS idx_search_history_search_query_id 
ON public.search_history(search_query_id);

-- ============================================
-- 3. PERFORMANCE FIX: Optimize RLS Policies
-- ============================================
-- Replace auth.uid() with (select auth.uid()) for better performance

-- Profiles policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK ((select auth.uid()) = id);

-- Search queries policies
DROP POLICY IF EXISTS "Users can view own search queries" ON public.search_queries;
CREATE POLICY "Users can view own search queries" ON public.search_queries
    FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own search queries" ON public.search_queries;
CREATE POLICY "Users can create own search queries" ON public.search_queries
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- Search results policies
DROP POLICY IF EXISTS "Users can view own search results" ON public.search_results;
CREATE POLICY "Users can view own search results" ON public.search_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.search_queries
            WHERE search_queries.id = search_results.search_query_id
            AND search_queries.user_id = (select auth.uid())
        )
    );

DROP POLICY IF EXISTS "Users can create own search results" ON public.search_results;
CREATE POLICY "Users can create own search results" ON public.search_results
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.search_queries
            WHERE search_queries.id = search_results.search_query_id
            AND search_queries.user_id = (select auth.uid())
        )
    );

-- Person profiles policy
DROP POLICY IF EXISTS "Users can view searched person profiles" ON public.person_profiles;
CREATE POLICY "Users can view searched person profiles" ON public.person_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.search_results
            JOIN public.search_queries ON search_queries.id = search_results.search_query_id
            WHERE search_results.person_profile_id = person_profiles.id
            AND search_queries.user_id = (select auth.uid())
        )
    );

-- Addresses policy
DROP POLICY IF EXISTS "Users can view addresses of searched profiles" ON public.addresses;
CREATE POLICY "Users can view addresses of searched profiles" ON public.addresses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.search_results
            JOIN public.search_queries ON search_queries.id = search_results.search_query_id
            WHERE search_results.person_profile_id = addresses.person_profile_id
            AND search_queries.user_id = (select auth.uid())
        )
    );

-- Phone numbers policy
DROP POLICY IF EXISTS "Users can view phone numbers of searched profiles" ON public.phone_numbers;
CREATE POLICY "Users can view phone numbers of searched profiles" ON public.phone_numbers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.search_results
            JOIN public.search_queries ON search_queries.id = search_results.search_query_id
            WHERE search_results.person_profile_id = phone_numbers.person_profile_id
            AND search_queries.user_id = (select auth.uid())
        )
    );

-- Social media policy
DROP POLICY IF EXISTS "Users can view social media of searched profiles" ON public.social_media;
CREATE POLICY "Users can view social media of searched profiles" ON public.social_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.search_results
            JOIN public.search_queries ON search_queries.id = search_results.search_query_id
            WHERE search_results.person_profile_id = social_media.person_profile_id
            AND search_queries.user_id = (select auth.uid())
        )
    );

-- Criminal records policy
DROP POLICY IF EXISTS "Users can view criminal records of searched profiles" ON public.criminal_records;
CREATE POLICY "Users can view criminal records of searched profiles" ON public.criminal_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.search_results
            JOIN public.search_queries ON search_queries.id = search_results.search_query_id
            WHERE search_results.person_profile_id = criminal_records.person_profile_id
            AND search_queries.user_id = (select auth.uid())
        )
    );

-- Relatives policy
DROP POLICY IF EXISTS "Users can view relatives of searched profiles" ON public.relatives;
CREATE POLICY "Users can view relatives of searched profiles" ON public.relatives
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.search_results
            JOIN public.search_queries ON search_queries.id = search_results.search_query_id
            WHERE search_results.person_profile_id = relatives.person_profile_id
            AND search_queries.user_id = (select auth.uid())
        )
    );

-- Search history policies
DROP POLICY IF EXISTS "Users can view own search history" ON public.search_history;
CREATE POLICY "Users can view own search history" ON public.search_history
    FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own search history" ON public.search_history;
CREATE POLICY "Users can create own search history" ON public.search_history
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- Favorite searches policies
DROP POLICY IF EXISTS "Users can view own favorite searches" ON public.favorite_searches;
CREATE POLICY "Users can view own favorite searches" ON public.favorite_searches
    FOR SELECT USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can create own favorite searches" ON public.favorite_searches;
CREATE POLICY "Users can create own favorite searches" ON public.favorite_searches
    FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete own favorite searches" ON public.favorite_searches;
CREATE POLICY "Users can delete own favorite searches" ON public.favorite_searches
    FOR DELETE USING ((select auth.uid()) = user_id);

