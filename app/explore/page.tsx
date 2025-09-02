'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useInView } from 'react-intersection-observer'
import { createClient } from '@/lib/supabase/client'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { format } from 'date-fns'

// UI Components & Icons
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Calendar, Loader2, Bookmark, ServerCrash } from 'lucide-react'

// Types
import type { EventWithClub } from '@/lib/types/sql-table-types'

// --- Constants ---
const EVENTS_PER_PAGE = 9;

// --- Data Fetching Function ---
async function fetchEvents({ pageParam = 0, filters, user, role }: any) {
  const supabase = createClient()
  let query = supabase
    .from('events')
    .select(`
      id, name, date, banner_url, event_type,
      club:clubs!inner(name, university:school(id, name)),
      tracked_events!left(student_id)
    `, { count: 'exact' })
    .eq('club.verification_status', 'verified')

  // === NEW FILTERING LOGIC ===
  if (role === 'guest') {
    // Guests can ONLY see inter-school events.
    query = query.eq('event_type', 'inter-school')
  } else {
    // Students have more options.
    if (filters.scope === 'in-college') {
      // Shows all events (intra & inter) from their college.
      query = query.eq('club.university.id', user.user_metadata.school_id)
    } else if (filters.scope === 'out-college') {
      // Shows ONLY inter-school events from other colleges.
      query = query.neq('club.university.id', user.user_metadata.school_id)
        .eq('event_type', 'inter-school')
    }
  }

  // Text Search Filter
  if (filters.search) {
    query = query.ilike('name', `%${filters.search}%`)
  }

  // Date Filter
  const now = new Date().toISOString()
  if (filters.date === 'upcoming') {
    query = query.gte('date', now).order('date', { ascending: true })
  } else if (filters.date === 'past') {
    query = query.lt('date', now).order('date', { ascending: false })
  }

  // Pagination
  const from = pageParam * EVENTS_PER_PAGE
  const to = from + EVENTS_PER_PAGE - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  // Map data to include a simple `is_tracked` boolean
  const events = data.map(event => ({
    ...event,
    is_tracked: event.tracked_events.length > 0,
  }));

  return { events, count, nextCursor: data.length < EVENTS_PER_PAGE ? null : pageParam + 1 }
}

// --- Main Page Component ---
export default function ExplorePage() {
  const { user, role } = useAuth()
  const { ref, inView } = useInView()
  const queryClient = useQueryClient()

  const [filters, setFilters] = useState({
    search: '',
    date: 'upcoming',
    scope: role === 'student' ? 'in-college' : 'out-college',
  })

  // When role changes (e.g., on login), reset the scope filter
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      scope: role === 'student' ? 'in-college' : 'out-college'
    }))
  }, [role])

  const {
    data, error, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['explore-events', filters, user?.id, role],
    queryFn: ({ pageParam }) => fetchEvents({ pageParam, filters, user, role }),

    // v-- ADD THIS LINE --v
    initialPageParam: 0, // Tells React Query to start fetching from page 0
    // ^-- ADD THIS LINE --^

    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!user, // Fetch only when user context is available
  })

  const trackMutation = useMutation({
    mutationFn: async ({ eventId, isTracked }: { eventId: string; isTracked: boolean }) => {
      const supabase = createClient()
      if (isTracked) {
        const { error } = await supabase.from('tracked_events').delete().match({ student_id: user!.id, event_id: eventId })
        if (error) throw new Error("Failed to untrack event.")
      } else {
        const { error } = await supabase.from('tracked_events').insert({ student_id: user!.id, event_id: eventId })
        if (error) throw new Error("Failed to track event.")
      }
    },
    onSuccess: () => {
      toast.success("Your tracked events have been updated.")
      queryClient.invalidateQueries({ queryKey: ['explore-events'] })
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, fetchNextPage])

  const events = data?.pages.flatMap((page) => page.events) ?? []
  const totalEvents = data?.pages[0]?.count ?? 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <header className="mb-8 text-center"><h1 className="text-4xl md:text-5xl font-bold tracking-tight">Explore Events</h1><p className="mt-2 text-lg text-muted-foreground">Find what's happening on your campus and beyond.</p></header>

      {/* Filter Bar */}
      <Card className="mb-8 sticky top-20 z-10 shadow-lg"><CardContent className="p-4 md:p-6"><div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 items-end"><div className="md:col-span-3 lg:col-span-2"><label className="block text-sm font-medium mb-1">Search Events</label><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" /><Input type="text" placeholder="Search by event name..." value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} className="pl-10" /></div></div><div><label className="block text-sm font-medium mb-1">When</label><Select value={filters.date} onValueChange={(value) => setFilters(prev => ({ ...prev, date: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="upcoming">Upcoming</SelectItem><SelectItem value="past">Past</SelectItem></SelectContent></Select></div><div><label className="block text-sm font-medium mb-1">Scope</label><Select value={filters.scope} onValueChange={(value) => setFilters(prev => ({ ...prev, scope: value }))} disabled={role === 'guest'}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{role === 'student' && <SelectItem value="in-college">In My College</SelectItem>}<SelectItem value="out-college">{role === 'student' ? "Other Colleges" : "All Colleges"}</SelectItem></SelectContent></Select></div></div></CardContent></Card>

      {/* Results */}
      <main>
        {isLoading && <GridSkeleton />}
        {error && <ErrorState message={error.message} />}
        {!isLoading && !error && (
          events.length > 0 ? (
            <>
              <p className="text-muted-foreground mb-6">Showing <span className="font-bold text-foreground">{events.length}</span> of <span className="font-bold text-foreground">{totalEvents}</span> events.</p>
              <AnimatePresence>
                <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <EventCard key={event.id} event={event} onTrack={trackMutation.mutate} isTrackingDisabled={role !== 'student'} />
                  ))}
                </motion.div>
              </AnimatePresence>
              <div ref={ref} className="flex justify-center mt-8 h-10">{isFetchingNextPage && <Loader2 className="animate-spin" />}{!hasNextPage && events.length > 0 && <p className="text-muted-foreground">You've reached the end!</p>}</div>
            </>
          ) : (
            <EmptyState onClear={() => setFilters({ search: '', date: 'upcoming', scope: role === 'student' ? 'in-college' : 'out-college' })} />
          )
        )}
      </main>
    </div>
  )
}

// --- UI Sub-Components (Mostly unchanged) ---
const EventCard = ({ event, onTrack, isTrackingDisabled }: { event: any; onTrack: Function; isTrackingDisabled: boolean }) => (
  <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
    <Card className="overflow-hidden h-full flex flex-col group relative">
      <div className='relative'>
        <img src={event.banner_url || 'https://placehold.co/400x200/d1fae5/065f46'} alt={event.name} className="h-40 w-full object-cover" />
        {event.event_type === 'inter-school' && (
          <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs font-bold py-1 px-2 rounded-full">INTER-COLLEGE</div>
        )}
      </div>
      <CardContent className="p-4 flex flex-col flex-grow">
        <p className="text-sm text-primary font-semibold">{format(new Date(event.date), "MMM dd, yyyy 'at' h:mm a")}</p>
        <h3 className="font-bold text-lg truncate mt-1">{event.name}</h3>
        <p className="text-sm text-muted-foreground">{event.club.university.name}</p>
        <p className="text-sm text-muted-foreground mt-auto pt-2">by {event.club.name}</p>
      </CardContent>
      {!isTrackingDisabled && (
        <Button size="icon" variant="ghost" className="absolute top-2 right-2 bg-black/30 hover:bg-black/50 text-white" onClick={() => onTrack({ eventId: event.id, isTracked: event.is_tracked })}>
          <Bookmark className={`transition-colors ${event.is_tracked ? 'fill-primary text-primary' : ''}`} />
        </Button>
      )}
    </Card>
  </motion.div>
)

const GridSkeleton = () => <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{Array.from({ length: 6 }).map((_, i) => (<Card key={i}><Skeleton className="h-40 w-full" /><div className="p-4 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-5 w-full" /><Skeleton className="h-4 w-1/2 mt-4" /></div></Card>))}</div>
const EmptyState = ({ onClear }: { onClear: () => void }) => <Card className="flex flex-col items-center justify-center text-center py-16"><Calendar className="h-16 w-16 text-muted-foreground mb-4" /><h3 className="text-xl font-semibold mb-2">No Events Found</h3><p className="text-muted-foreground max-w-md mb-6">Try adjusting your filters to find what you're looking for.</p><Button variant="outline" onClick={onClear}>Clear Filters</Button></Card>
const ErrorState = ({ message }: { message: string }) => <Card className="flex flex-col items-center justify-center text-center py-16 bg-destructive/10 text-destructive"><ServerCrash className="h-16 w-16 mb-4" /><h3 className="text-xl font-semibold mb-2">Something Went Wrong</h3><p className="max-w-md">{message}</p></Card>