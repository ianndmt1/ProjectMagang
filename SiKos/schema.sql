-- SiKos Boarding House Management Database Schema
-- Run this in the Supabase SQL Editor

-- 1. Create Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Create Rooms Table
CREATE TABLE IF NOT EXISTS public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_number TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('empty', 'occupied', 'overdue')),
    type TEXT NOT NULL CHECK (type IN ('daily', 'monthly', 'both')),
    daily_rent NUMERIC DEFAULT 0 NOT NULL,
    monthly_rent NUMERIC DEFAULT 0 NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Rooms
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to rooms" ON public.rooms
    FOR ALL USING (auth.role() = 'authenticated');

-- 3. Create Tenants Table
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT NOT NULL,
    room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE,
    status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Tenants
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to tenants" ON public.tenants
    FOR ALL USING (auth.role() = 'authenticated');

-- 4. Create Payments Table
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC NOT NULL,
    payment_date DATE NOT NULL,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'transfer')),
    status TEXT NOT NULL CHECK (status IN ('paid', 'pending', 'late')),
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    proof_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS for Payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access to payments" ON public.payments
    FOR ALL USING (auth.role() = 'authenticated');

-- 5. Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, email, role)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'name', 'New User'),
        new.email,
        COALESCE(new.raw_user_meta_data->>'role', 'admin')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed data for rooms (optional, run if you want preview data in Supabase)
-- INSERT INTO public.rooms (room_number, status, type, daily_rent, monthly_rent, description) VALUES
-- ('A1', 'empty', 'both', 150000, 1500000, 'AC, Bathroom Inside, Queen Bed'),
-- ('A2', 'empty', 'monthly', 0, 1200000, 'AC, Queen Bed, Shared Bathroom'),
-- ('B1', 'empty', 'both', 100000, 1000000, 'Fan, Single Bed, Shared Bathroom');
