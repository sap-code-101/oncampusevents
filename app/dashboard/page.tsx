'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { format } from 'date-fns'
import { motion } from 'framer-motion'

// UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import LogOutButton from '@/components/logout-botton'
import { User, School, CalendarCheck2, Users2, ShieldAlert, UniversityIcon } from 'lucide-react'

// Types
import type { User as AuthUser } from '@supabase/supabase-js'
import type { Club, Event } from '@/lib/types/sql-table-types'


// --- Main Page Component ---
export default function DashboardPage() {
  const { user, role } = useAuth()
  const router = useRouter()

  const { data: school } = useQuery({
    queryKey: ['school', user?.id],
    queryFn: async () => {
      if (!user) return null
      const supabase = createClient()
      const { data, error } = await supabase
        .from('schools') // Corrected table name
        .select('name, location, image_url')
        .eq('id', user.user_metadata.school_id)
        .single()
      if (error) throw new Error('Failed to fetch school profile.')
      return data
    },
    enabled: !!user,
  })

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  // Loading and Guest states remain the same...
  if (!user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-foreground">
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: 'easeOut' }} className="text-center">
          <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
          </div>
          <h2 className="text-xl font-semibold">Loading Your Dashboard</h2>
          <p className="text-muted-foreground">Just a moment...</p>
        </motion.div>
      </div>
    )
  }

  if (role === 'guest') {
    const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md animate-fade-in-up shadow-lg">
          <CardHeader className="flex flex-col items-center text-center">
            <Avatar className="h-20 w-20 border-4 border-background"><AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name} /><AvatarFallback className="text-2xl bg-secondary">{getInitials(user.user_metadata.full_name || user.email || '')}</AvatarFallback></Avatar>
            <div className="mt-4"><CardTitle>{user.user_metadata.full_name}</CardTitle><CardDescription>{user.email}</CardDescription></div>
          </CardHeader>
          <CardContent className="p-6 pt-2 text-center">
            <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4"><ShieldAlert className="mx-auto h-8 w-8 text-destructive" /><h3 className="mt-2 font-semibold text-destructive">Student Access Required</h3><p className="mt-1 text-sm text-destructive/90">This dashboard is only available to users who have signed up with a valid student email.</p></div>
          </CardContent>
          <CardFooter className="flex flex-col items-center gap-2 p-6 pt-0"><LogOutButton /><p className="text-xs text-muted-foreground">Please sign out and log in with your student account.</p></CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-fade-in-up">
      <Tabs defaultValue="participated_events" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="participated_events"><CalendarCheck2 className="mr-2 h-4 w-4" /> Participated</TabsTrigger>
          <TabsTrigger value="joined_clubs"><Users2 className="mr-2 h-4 w-4" /> Joined Clubs</TabsTrigger>
          <TabsTrigger value="user_info"><User className="mr-2 h-4 w-4" /> My Info</TabsTrigger>
        </TabsList>

        <TabsContent value="participated_events"><ParticipatedEventsTab /></TabsContent>
        <TabsContent value="joined_clubs"><JoinedClubsTab /></TabsContent>
        <TabsContent value="user_info"><UserInfoTab user={user} school={school} /></TabsContent>
      </Tabs>
    </div>
  )
}

// --- Tab-Specific Components ---

function ParticipatedEventsTab() {
  const { data: events, isLoading } = useQuery({
    queryKey: ['participated_events'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from('event_participants').select('events(*, clubs(name))')
      if (error) throw new Error('Could not fetch participated events.')
      return data.map((item) => item.events) as unknown as Event[]
    },
  })
  if (isLoading) return <TabSkeleton title="Loading Participated Events..." />
  return <TabContent title="Participated Events" data={events} emptyMessage="You haven't participated in any events." />
}

function JoinedClubsTab() {
  const { data: clubs, isLoading } = useQuery({
    queryKey: ['joined_clubs'],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase.from('memberships').select('clubs(*)')
      if (error) throw new Error('Could not fetch joined clubs.')
      return data.map((item) => item.clubs) as unknown as Club[]
    },
  })
  if (isLoading) return <TabSkeleton title="Loading Joined Clubs..." />
  return <TabContent title="Joined Clubs" data={clubs} emptyMessage="You haven't joined any clubs yet." type="club" />
}

function UserInfoTab({ user, school }: { user: AuthUser; school: { name: string; image_url: string; location: string; } | null | undefined; }) {
  const getInitials = (name: string) => name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()

  return (
    <Card>
      <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
        <Avatar className="h-24 w-24 border-4"><AvatarImage src={user.user_metadata.avatar_url} alt={user.user_metadata.full_name} /><AvatarFallback className="text-3xl bg-secondary text-primary-foreground">{getInitials(user.user_metadata.full_name || user.email || '')}</AvatarFallback></Avatar>
        <div className="text-center sm:text-left">
          <p className="text-sm text-primary font-semibold">{user.user_metadata.school_id ? "Student" : "Guest"}</p>
          <h2 className="text-2xl font-bold">{user.user_metadata.full_name}</h2>
          <p className="text-muted-foreground">{user.email}</p>
          {school && <div className="flex items-center gap-2 mt-2 text-muted-foreground justify-center sm:justify-start">
            {school.image_url ? <img src={school.image_url} alt={school.name} className="h-6 w-6 object-contain" /> : <UniversityIcon />}
            <span className='font-semibold'>{school.name}</span>
            <span>({school.location})</span>
          </div>
          }
          <div className="mt-4">
            <LogOutButton />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// --- Reusable UI Components ---

function TabContent({ title, data, emptyMessage, type = 'event' }: { title: string; data: any[] | undefined; emptyMessage: string; type?: 'event' | 'club' }) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold mb-4">{title}</h2>
        {data && data.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((item: any) =>
              type === 'event' ? (
                <div key={item.id} className="border p-4 rounded-lg">
                  <p className="font-bold">{item.name}</p>
                  <p className="text-sm text-muted-foreground">by {item.clubs.name}</p>
                  <p className="text-xs mt-2">{format(new Date(item.date), 'PPpp')}</p>
                </div>
              ) : (
                <div key={item.id} className="border p-4 rounded-lg">
                  <p className="font-bold">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.category}</p>
                </div>
              )
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">{emptyMessage}</p>
        )}
      </CardContent>
    </Card>
  )
}

function TabSkeleton({ title }: { title: string }) {
  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="text-2xl font-semibold mb-4">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  )
}