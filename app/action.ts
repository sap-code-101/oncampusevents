'use server'

import { createClient } from '@/lib/supabase/server'
import type { EventWithClub } from '@/lib/types/sql-table-types'

export async function getHomePageData() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const profile = user?.user_metadata.school_id


  let upcomingEvents: EventWithClub[] = []
  if (!profile) return { upcomingEvents: [], error: "User is not a student" }
  const { data: eventsData, error } = await supabase
    .from('events')
    .select('*, clubs(id, name)')
    .eq('clubs.school_id', profile.school_id)
    .gte('date', new Date().toISOString())
    .order('date', { ascending: true })
    .limit(10)

  upcomingEvents = (eventsData as EventWithClub[])


  return { upcomingEvents, error }
}