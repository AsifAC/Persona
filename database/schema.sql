-- Persona Database Schema for Supabase/PostgreSQL
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (Supabase Auth handles this, but we'll create a profiles table)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Search Queries table
CREATE TABLE IF NOT EXISTS public.search_queries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    age INTEGER,
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Person Profiles table
CREATE TABLE IF NOT EXISTS public.person_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    age INTEGER,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Search Results table
CREATE TABLE IF NOT EXISTS public.search_results (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    search_query_id UUID REFERENCES public.search_queries(id) ON DELETE CASCADE,
    person_profile_id UUID REFERENCES public.person_profiles(id) ON DELETE CASCADE,
    confidence_score DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Addresses table
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    person_profile_id UUID REFERENCES public.person_profiles(id) ON DELETE CASCADE,
    street TEXT,
    city TEXT NOT NULL,
    state TEXT,
    zip_code TEXT,
    country TEXT DEFAULT 'USA',
    is_current BOOLEAN DEFAULT false,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Phone Numbers table
CREATE TABLE IF NOT EXISTS public.phone_numbers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    person_profile_id UUID REFERENCES public.person_profiles(id) ON DELETE CASCADE,
    number TEXT NOT NULL,
    type TEXT DEFAULT 'mobile', -- mobile, landline, work, etc.
    is_current BOOLEAN DEFAULT true,
    last_verified TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Social Media table
CREATE TABLE IF NOT EXISTS public.social_media (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    person_profile_id UUID REFERENCES public.person_profiles(id) ON DELETE CASCADE,
    platform TEXT NOT NULL, -- facebook, twitter, instagram, linkedin, etc.
    username TEXT,
    url TEXT,
    last_active TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Criminal Records table
CREATE TABLE IF NOT EXISTS public.criminal_records (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    person_profile_id UUID REFERENCES public.person_profiles(id) ON DELETE CASCADE,
    case_number TEXT,
    charge TEXT NOT NULL,
    status TEXT, -- pending, convicted, acquitted, etc.
    record_date DATE,
    jurisdiction TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Relatives table
CREATE TABLE IF NOT EXISTS public.relatives (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    person_profile_id UUID REFERENCES public.person_profiles(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT,
    relationship TEXT, -- mother, father, sibling, spouse, etc.
    age INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Search History table
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    search_query_id UUID REFERENCES public.search_queries(id) ON DELETE CASCADE,
    searched_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

-- Favorite Searches table
CREATE TABLE IF NOT EXISTS public.favorite_searches (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    search_query_id UUID REFERENCES public.search_queries(id) ON DELETE CASCADE,
    label TEXT,
    favorited_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
    UNIQUE(user_id, search_query_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_search_queries_user_id ON public.search_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_search_queries_name ON public.search_queries(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_search_results_query_id ON public.search_results(search_query_id);
CREATE INDEX IF NOT EXISTS idx_search_results_profile_id ON public.search_results(person_profile_id);
CREATE INDEX IF NOT EXISTS idx_person_profiles_name ON public.person_profiles(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_addresses_profile_id ON public.addresses(person_profile_id);
CREATE INDEX IF NOT EXISTS idx_phone_numbers_profile_id ON public.phone_numbers(person_profile_id);
CREATE INDEX IF NOT EXISTS idx_social_media_profile_id ON public.social_media(person_profile_id);
CREATE INDEX IF NOT EXISTS idx_criminal_records_profile_id ON public.criminal_records(person_profile_id);
CREATE INDEX IF NOT EXISTS idx_relatives_profile_id ON public.relatives(person_profile_id);
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_favorite_searches_user_id ON public.favorite_searches(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criminal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_searches ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Search queries policies
CREATE POLICY "Users can view own search queries" ON public.search_queries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own search queries" ON public.search_queries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Search results policies
CREATE POLICY "Users can view own search results" ON public.search_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.search_queries
            WHERE search_queries.id = search_results.search_query_id
            AND search_queries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own search results" ON public.search_results
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.search_queries
            WHERE search_queries.id = search_results.search_query_id
            AND search_queries.user_id = auth.uid()
        )
    );

-- Person profiles policies (users can view profiles they've searched for)
CREATE POLICY "Users can view searched person profiles" ON public.person_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.search_results
            JOIN public.search_queries ON search_queries.id = search_results.search_query_id
            WHERE search_results.person_profile_id = person_profiles.id
            AND search_queries.user_id = auth.uid()
        )
    );

-- Related data policies (addresses, phone numbers, etc.)
CREATE POLICY "Users can view addresses of searched profiles" ON public.addresses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.search_results
            JOIN public.search_queries ON search_queries.id = search_results.search_query_id
            WHERE search_results.person_profile_id = addresses.person_profile_id
            AND search_queries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view phone numbers of searched profiles" ON public.phone_numbers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.search_results
            JOIN public.search_queries ON search_queries.id = search_results.search_query_id
            WHERE search_results.person_profile_id = phone_numbers.person_profile_id
            AND search_queries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view social media of searched profiles" ON public.social_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.search_results
            JOIN public.search_queries ON search_queries.id = search_results.search_query_id
            WHERE search_results.person_profile_id = social_media.person_profile_id
            AND search_queries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view criminal records of searched profiles" ON public.criminal_records
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.search_results
            JOIN public.search_queries ON search_queries.id = search_results.search_query_id
            WHERE search_results.person_profile_id = criminal_records.person_profile_id
            AND search_queries.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view relatives of searched profiles" ON public.relatives
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.search_results
            JOIN public.search_queries ON search_queries.id = search_results.search_query_id
            WHERE search_results.person_profile_id = relatives.person_profile_id
            AND search_queries.user_id = auth.uid()
        )
    );

-- Search history policies
CREATE POLICY "Users can view own search history" ON public.search_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own search history" ON public.search_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Favorite searches policies
CREATE POLICY "Users can view own favorite searches" ON public.favorite_searches
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own favorite searches" ON public.favorite_searches
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorite searches" ON public.favorite_searches
    FOR DELETE USING (auth.uid() = user_id);

-- Function to automatically create profile on user sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

