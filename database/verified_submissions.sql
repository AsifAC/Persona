-- Verified user submissions schema for person info

CREATE TABLE IF NOT EXISTS public.verification_admins (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.person_info_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  person_profile_id UUID REFERENCES public.person_profiles(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  age INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewer_notes TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.person_info_addresses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id UUID REFERENCES public.person_info_submissions(id) ON DELETE CASCADE,
  street TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  country TEXT DEFAULT 'USA',
  is_current BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE
);

CREATE TABLE IF NOT EXISTS public.person_info_phone_numbers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id UUID REFERENCES public.person_info_submissions(id) ON DELETE CASCADE,
  number TEXT NOT NULL,
  type TEXT DEFAULT 'mobile',
  is_current BOOLEAN DEFAULT true,
  last_verified TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.person_info_social_media (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id UUID REFERENCES public.person_info_submissions(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  username TEXT,
  url TEXT
);

CREATE TABLE IF NOT EXISTS public.person_info_criminal_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id UUID REFERENCES public.person_info_submissions(id) ON DELETE CASCADE,
  case_number TEXT,
  charge TEXT NOT NULL,
  status TEXT,
  record_date DATE,
  jurisdiction TEXT
);

CREATE TABLE IF NOT EXISTS public.person_info_relatives (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id UUID REFERENCES public.person_info_submissions(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  relationship TEXT,
  age INTEGER
);

CREATE TABLE IF NOT EXISTS public.person_info_past_names (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id UUID REFERENCES public.person_info_submissions(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS public.person_info_proofs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  submission_id UUID REFERENCES public.person_info_submissions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  content_type TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_person_info_submissions_user_id ON public.person_info_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_person_info_submissions_status ON public.person_info_submissions(status);
CREATE INDEX IF NOT EXISTS idx_person_info_addresses_submission_id ON public.person_info_addresses(submission_id);
CREATE INDEX IF NOT EXISTS idx_person_info_phones_submission_id ON public.person_info_phone_numbers(submission_id);
CREATE INDEX IF NOT EXISTS idx_person_info_social_submission_id ON public.person_info_social_media(submission_id);
CREATE INDEX IF NOT EXISTS idx_person_info_criminal_submission_id ON public.person_info_criminal_records(submission_id);
CREATE INDEX IF NOT EXISTS idx_person_info_relatives_submission_id ON public.person_info_relatives(submission_id);
CREATE INDEX IF NOT EXISTS idx_person_info_past_names_submission_id ON public.person_info_past_names(submission_id);
CREATE INDEX IF NOT EXISTS idx_person_info_proofs_submission_id ON public.person_info_proofs(submission_id);

ALTER TABLE public.verification_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_info_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_info_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_info_phone_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_info_social_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_info_criminal_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_info_relatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_info_past_names ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_info_proofs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Verification admins can view self" ON public.verification_admins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create submissions" ON public.person_info_submissions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view approved or own submissions" ON public.person_info_submissions
  FOR SELECT USING (
    status = 'approved'
    OR auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.verification_admins v
      WHERE v.user_id = auth.uid()
    )
  );

CREATE POLICY "Verifiers can update submissions" ON public.person_info_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.verification_admins v
      WHERE v.user_id = auth.uid()
    )
  );

CREATE POLICY "Users or verifiers can delete submissions" ON public.person_info_submissions
  FOR DELETE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.verification_admins v
      WHERE v.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert addresses" ON public.person_info_addresses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view addresses" ON public.person_info_addresses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND (
        s.status = 'approved'
        OR s.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.verification_admins v WHERE v.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users or verifiers can modify addresses" ON public.person_info_addresses
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND (
        s.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.verification_admins v WHERE v.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users or verifiers can delete addresses" ON public.person_info_addresses
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND (
        s.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.verification_admins v WHERE v.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can insert phone numbers" ON public.person_info_phone_numbers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view phone numbers" ON public.person_info_phone_numbers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND (
        s.status = 'approved'
        OR s.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.verification_admins v WHERE v.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users or verifiers can modify phone numbers" ON public.person_info_phone_numbers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND (
        s.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.verification_admins v WHERE v.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users or verifiers can delete phone numbers" ON public.person_info_phone_numbers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND (
        s.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.verification_admins v WHERE v.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can insert social media" ON public.person_info_social_media
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view social media" ON public.person_info_social_media
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND (
        s.status = 'approved'
        OR s.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.verification_admins v WHERE v.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users or verifiers can modify social media" ON public.person_info_social_media
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND (
        s.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.verification_admins v WHERE v.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users or verifiers can delete social media" ON public.person_info_social_media
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND (
        s.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.verification_admins v WHERE v.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can insert criminal records" ON public.person_info_criminal_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view criminal records" ON public.person_info_criminal_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND (
        s.status = 'approved'
        OR s.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.verification_admins v WHERE v.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users or verifiers can modify criminal records" ON public.person_info_criminal_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND (
        s.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.verification_admins v WHERE v.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users or verifiers can delete criminal records" ON public.person_info_criminal_records
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND (
        s.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.verification_admins v WHERE v.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can insert relatives" ON public.person_info_relatives
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view relatives" ON public.person_info_relatives
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND (
        s.status = 'approved'
        OR s.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.verification_admins v WHERE v.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users or verifiers can modify relatives" ON public.person_info_relatives
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND (
        s.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.verification_admins v WHERE v.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users or verifiers can delete relatives" ON public.person_info_relatives
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND (
        s.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.verification_admins v WHERE v.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can insert past names" ON public.person_info_past_names
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view past names" ON public.person_info_past_names
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND (
        s.status = 'approved'
        OR s.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.verification_admins v WHERE v.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users or verifiers can modify past names" ON public.person_info_past_names
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND (
        s.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.verification_admins v WHERE v.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users or verifiers can delete past names" ON public.person_info_past_names
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND (
        s.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.verification_admins v WHERE v.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can insert proofs" ON public.person_info_proofs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND s.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view proofs" ON public.person_info_proofs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.person_info_submissions s
      WHERE s.id = submission_id AND (
        s.user_id = auth.uid()
        OR EXISTS (SELECT 1 FROM public.verification_admins v WHERE v.user_id = auth.uid())
      )
    )
  );
