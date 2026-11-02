-- Table: public.search_attempt_logs
-- Description: Stores search attempts including keywords and access code usage for analytics.

CREATE TABLE IF NOT EXISTS public.search_attempt_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    keyword TEXT NOT NULL,
    organization_id UUID REFERENCES public.partner_organizations(id) ON DELETE SET NULL,
    access_code TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE public.search_attempt_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated/anon can insert logs, but only admins can read them
CREATE POLICY "Anyone can insert search logs" ON public.search_attempt_logs
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Admins can view search logs" ON public.search_attempt_logs
    FOR SELECT 
    USING (true); -- Replace with proper admin check later

-- Index for performance
CREATE INDEX IF NOT EXISTS search_attempt_logs_org_idx ON public.search_attempt_logs(organization_id);
CREATE INDEX IF NOT EXISTS search_attempt_logs_created_at_idx ON public.search_attempt_logs(created_at DESC);
