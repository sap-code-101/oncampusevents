/*
  # Initial Schema for CampusPlus Platform

  1. New Tables
    - `universities`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `domain` (text, unique) - email domain like 'kiit.ac.in'
      - `subdomain` (text, unique) - for kiit.campusplus.com
      - `location` (text)
      - `created_at` (timestamp)
    
    - `profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `university_id` (uuid, references universities)
      - `full_name` (text)
      - `role` (enum: student, admin)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `clubs`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `category` (text)
      - `logo_url` (text, nullable)
      - `university_id` (uuid, references universities)
      - `creator_id` (uuid, references profiles)
      - `verification_status` (enum: pending, verified, rejected)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `events`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `date` (timestamptz)
      - `location` (text)
      - `banner_url` (text, nullable)
      - `club_id` (uuid, references clubs)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Add admin-only policies for club verification
*/

-- Create enum types
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE user_role AS ENUM ('student', 'admin');

-- Universities table
CREATE TABLE IF NOT EXISTS universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  domain text UNIQUE NOT NULL,
  subdomain text UNIQUE NOT NULL,
  location text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  university_id uuid REFERENCES universities(id) NOT NULL,
  full_name text NOT NULL,
  role user_role DEFAULT 'student',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Clubs table
CREATE TABLE IF NOT EXISTS clubs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  logo_url text,
  university_id uuid REFERENCES universities(id) NOT NULL,
  creator_id uuid REFERENCES profiles(id) NOT NULL,
  verification_status verification_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, university_id)
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  date timestamptz NOT NULL,
  location text NOT NULL,
  banner_url text,
  club_id uuid REFERENCES clubs(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policies for universities (public read)
CREATE POLICY "Universities are viewable by everyone"
  ON universities
  FOR SELECT
  USING (true);

-- Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policies for clubs
CREATE POLICY "Anyone can view verified clubs"
  ON clubs
  FOR SELECT
  USING (verification_status = 'verified' OR creator_id = auth.uid());

CREATE POLICY "Users can create clubs"
  ON clubs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own clubs"
  ON clubs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Policies for events
CREATE POLICY "Anyone can view events from verified clubs"
  ON events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clubs 
      WHERE clubs.id = events.club_id 
      AND clubs.verification_status = 'verified'
    )
  );

CREATE POLICY "Club creators can manage their events"
  ON events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM clubs 
      WHERE clubs.id = events.club_id 
      AND clubs.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clubs 
      WHERE clubs.id = events.club_id 
      AND clubs.creator_id = auth.uid()
    )
  );

-- Insert sample universities
INSERT INTO universities (name, domain, subdomain, location) VALUES
  ('KIIT Deemed University', 'kiit.ac.in', 'kiit', 'Bhubaneswar, Odisha'),
  ('Indian Institute of Technology Delhi', 'iitd.ac.in', 'iitd', 'New Delhi'),
  ('VIT University', 'vit.ac.in', 'vit', 'Vellore, Tamil Nadu'),
  ('Manipal Institute of Technology', 'manipal.edu', 'manipal', 'Manipal, Karnataka'),
  ('SRM Institute of Science and Technology', 'srmist.edu.in', 'srm', 'Chennai, Tamil Nadu'),
  ('Amity University', 'amity.edu', 'amity', 'Noida, Uttar Pradesh'),
  ('Lovely Professional University', 'lpu.co.in', 'lpu', 'Phagwara, Punjab'),
  ('Birla Institute of Technology and Science', 'pilani.bits-pilani.ac.in', 'bits', 'Pilani, Rajasthan')
ON CONFLICT (domain) DO NOTHING;

-- Function to handle user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, university_id, full_name, role)
  VALUES (
    new.id,
    new.email,
    (new.raw_user_meta_data->>'university_id')::uuid,
    new.raw_user_meta_data->>'full_name',
    'student'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for automatic profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();