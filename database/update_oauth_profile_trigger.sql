-- Update profile trigger to handle OAuth providers
-- This ensures OAuth users get proper profiles with name extraction

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        -- Extract first name from OAuth metadata or user metadata
        COALESCE(
            NEW.raw_user_meta_data->>'first_name',
            NEW.raw_user_meta_data->>'full_name',
            SPLIT_PART(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), ' ', 1),
            ''
        ),
        -- Extract last name from OAuth metadata or user metadata
        COALESCE(
            NEW.raw_user_meta_data->>'last_name',
            CASE 
                WHEN NEW.raw_user_meta_data->>'full_name' IS NOT NULL 
                THEN SPLIT_PART(NEW.raw_user_meta_data->>'full_name', ' ', 2)
                ELSE ''
            END,
            ''
        )
    )
    ON CONFLICT (id) DO UPDATE
    SET
        email = EXCLUDED.email,
        updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure search_path is set for security
ALTER FUNCTION public.handle_new_user() 
SET search_path = public, pg_temp;

