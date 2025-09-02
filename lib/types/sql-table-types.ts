// Corresponds to your `public.school` table
export type School = {
  id: string
  name: string
  location: string
  image_url: string | null
  subdomain: string
  email_suffix: string
  created_at: string
}

// Corresponds to your `public.students` table
// Includes a nested `school` object for when you JOIN data
export type StudentProfile = {
  id: string
  email: string
  school_id: string
  created_at: string
  updated_at: string
  school: {
    name: string
    image_url: string | null
  }
}

// Corresponds to your `public.clubs` table
export type Club = {
  id: string
  name: string
  description: string | null
  category: string | null
  logo_url: string | null
  school_id: string
  leader_id: string
  verification_status: 'pending' | 'verified' | 'rejected'
  created_at: string
  updated_at: string
}

// Corresponds to your `public.events` table
export type Event = {
  id: string
  name: string
  description: string | null
  date: string // ISO 8601 date string
  location: string | null
  banner_url: string | null
  club_id: string
}

// A special type for queries that join events with their parent club
export type EventWithClub = Event & {
  clubs: {
    id: string
    name: string
  }
}