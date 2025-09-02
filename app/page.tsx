'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'

// UI Components
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Compass, ServerCrash, Star, RefreshCw, ChevronRight, CalendarSearch, LayoutGrid } from 'lucide-react'

// Types
import type { EventWithClub } from '@/lib/types/sql-table-types'
import type { User } from '@supabase/supabase-js'


// --- Data Fetching Functions ---

async function fetchUpcomingEvents(): Promise<EventWithClub[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('events')
    .select('*, clubs(id, name)')
    .order('date', { ascending: true })
    .limit(10)
  if (error) throw new Error('Could not load upcoming events.')
  return data as EventWithClub[]
}

async function fetchTrackedEvents(): Promise<EventWithClub[]> {
  const supabase = createClient()
  const { data, error } = await supabase.from('tracked_events').select('events(*, clubs(id, name))')
  if (error) throw new Error('Could not load your tracked events.')
  return data.map(item => item.events) as unknown as EventWithClub[]
}


// --- Main Client Component ---
export default function HomePageClient() {
  const { user, role } = useAuth()

  if (user && role === 'student') {
    return <StudentDashboard user={user} />
  }
  return <GuestHero />
}

// --- Guest View ---
export function GuestHero() {
  return (
    <section className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center text-center px-4">
      <div className="animate-fade-in-up">
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter gradient-text">Campus, Connected.</h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl">Your university experience, amplified. Discover events, join clubs, and never miss a moment.</p>

      </div>
    </section>
  )
}

// --- Student View ---
function StudentDashboard({ user }: { user: User }) {
  const welcomeName = user?.user_metadata?.full_name?.split(' ')[0] || 'Student'

  const { data: upcomingEvents, isLoading: isLoadingUpcoming, isError: isErrorUpcoming, error: errorUpcoming, refetch: refetchUpcoming } = useQuery({
    queryKey: ['upcoming_events'],
    queryFn: fetchUpcomingEvents,
  })

  const { data: trackedEvents, isLoading: isLoadingTracked, isError: isErrorTracked, error: errorTracked, refetch: refetchTracked } = useQuery({
    queryKey: ['tracked_events', user.id],
    queryFn: fetchTrackedEvents,
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16 animate-fade-in-up">
      <section>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Welcome back, {welcomeName}!</h1>
        <p className="mt-2 text-lg text-muted-foreground">Here's a look at what's happening on campus.</p>
      </section>

      {/* --- Upcoming Events Section (Large, Scrollable Cards) --- */}
      <section>
        <div className="flex items-center justify-between mb-6"><h2 className="text-3xl font-bold tracking-tight">Upcoming Events</h2><Link href="/explore"><Button variant="outline">Explore All</Button></Link></div>
        {isLoadingUpcoming && <UpcomingEventsSkeleton />}
        {isErrorUpcoming && <EventsError error={errorUpcoming as Error} onRetry={refetchUpcoming} />}
        {upcomingEvents && (
          upcomingEvents.length > 0 ? (
            <ScrollArea className="w-full whitespace-nowrap"><div className="flex w-max space-x-4 pb-4">{upcomingEvents.map((event) => <EventCard key={event.id} event={event} />)}</div><ScrollBar orientation="horizontal" /></ScrollArea>
          ) : (
            <NoEvents type="upcoming" />
          )
        )}
      </section>

      {/* --- Tracked Events Section (Compact List) --- */}
      <section>
        <div className="flex items-center justify-between mb-6"><h2 className="text-3xl font-bold tracking-tight">Your Tracked Events</h2><Link href="/dashboard"><Button variant="outline">Go to Dashboard</Button></Link></div>
        <Card>
          <CardContent className="p-4">
            {isLoadingTracked && <TrackedEventsSkeleton />}
            {isErrorTracked && <EventsError error={errorTracked as Error} onRetry={refetchTracked} />}
            {trackedEvents && (
              trackedEvents.length > 0 ? (
                <div className="space-y-2">{trackedEvents.map((event) => <TrackedEventItem key={event.id} event={event} />)}</div>
              ) : (
                <NoEvents type="tracked" />
              )
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}


// --- UI Components ---

/**
 * Large, visually rich card for Upcoming Events
 */
function EventCard({ event }: { event: EventWithClub }) {
  return (
    <Link href={`/events/${event.id}`} className="block w-[320px] shrink-0 group">
      <Card className="overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-1 h-full flex flex-col">
        <div className="overflow-hidden"><img src={event.banner_url || 'https://placehold.co/400x200/d1fae5/065f46'} alt={event.name} className="h-40 w-full object-cover transition-transform duration-300 group-hover:scale-105" /></div>
        <CardContent className="p-4 flex flex-col flex-grow">
          <p className="text-sm text-primary font-semibold">{format(new Date(event.date), "MMM dd, yyyy 'at' h:mm a")}</p>
          <h3 className="font-bold text-lg truncate mt-1">{event.name}</h3>
          <p className="text-sm text-muted-foreground mt-auto pt-2">by {event.clubs.name}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

/**
 * Compact, list-item style card for Tracked Events
 */
function TrackedEventItem({ event }: { event: EventWithClub }) {
  return (
    <Link href={`/events/${event.id}`} className="block group">
      <div className="flex items-center space-x-4 p-3 rounded-lg transition-colors group-hover:bg-muted">
        <div className="flex flex-col items-center justify-center bg-muted/70 p-2 rounded-md w-16 h-16 text-center shrink-0">
          <span className="text-sm font-bold text-primary">{format(new Date(event.date), 'MMM')}</span>
          <span className="text-2xl font-bold tracking-tight">{format(new Date(event.date), 'dd')}</span>
        </div>
        <div className="flex-grow overflow-hidden">
          <p className="font-semibold truncate group-hover:text-primary transition-colors">{event.name}</p>
          <p className="text-sm text-muted-foreground truncate">by {event.clubs.name}</p>
        </div>
        <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 shrink-0" />
      </div>
    </Link>
  )
}

/**
 * Versatile Empty State Card
 */
function NoEvents({ type }: { type: 'upcoming' | 'tracked' }) {
  const isUpcoming = type === 'upcoming';
  return (
    <div className="flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/40 p-12 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">{isUpcoming ? <CalendarSearch className="h-8 w-8" /> : <Star className="h-8 w-8" />}</div>
      <h3 className="mt-6 text-xl font-semibold">{isUpcoming ? "The Stage is Quiet... For Now" : "Nothing Tracked Yet"}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{isUpcoming ? "There are no upcoming events, but you can explore clubs!" : "Track events to keep them here for easy access."}</p>
      <Link href="/explore" className="mt-6"><Button variant="secondary"><Compass className="mr-2 h-4 w-4" />Explore Events</Button></Link>
    </div>
  );
}

/**
 * Skeletons & Error States
 */
function UpcomingEventsSkeleton() {
  return <div className="flex space-x-4">{Array.from({ length: 3 }).map((_, i) => (<Card key={i} className="w-[320px] shrink-0"><Skeleton className="h-40 w-full" /><CardContent className="p-4 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-5 w-full" /><Skeleton className="h-4 w-1/2 mt-4" /></CardContent></Card>))}</div>
}

function TrackedEventsSkeleton() {
  return <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => (<div key={i} className="flex items-center space-x-4 p-3"><Skeleton className="h-16 w-16 rounded-md shrink-0" /><div className="space-y-2 flex-grow"><Skeleton className="h-5 w-full" /><Skeleton className="h-4 w-3/4" /></div></div>))}</div>
}

function EventsError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return <div className="flex w-full flex-col items-center justify-center rounded-lg bg-destructive/10 p-12 text-center text-destructive"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20"><ServerCrash className="h-8 w-8" /></div><h3 className="mt-6 text-xl font-semibold">Oops, Something Went Wrong</h3><p className="mt-2 text-sm text-destructive/90">{error.message}</p><Button onClick={onRetry} variant="destructive" className="mt-6"><RefreshCw className="mr-2 h-4 w-4" />Try Again</Button></div>
}