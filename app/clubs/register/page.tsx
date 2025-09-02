'use client'

import { useTransition, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { registerClubAction } from './actions'

// UI Components
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { clubSchema, ClubSchemaType } from '@/lib/validations'

const CLUB_CATEGORIES = ["Academic", "Arts & Culture", "Sports", "Technology", "Social", "Community Service", "Hobbies"]

export default function RegisterClubPage() {
  const { user, role } = useAuth()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // --- FIX ---
  // 1. ALL hooks must be called at the top, before any returns.
  const form = useForm<ClubSchemaType>({
    resolver: zodResolver(clubSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      logoUrl: ""
    },
  })

  // 2. Handle redirection in a useEffect hook.
  useEffect(() => {
    if (role === 'guest') {
      router.push('/auth/login')
    }
  }, [role, router])

  // --- END FIX ---

  const onSubmit = (values: ClubSchemaType) => {
    startTransition(async () => {
      const result = await registerClubAction(values)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success("Club submitted for verification!")
      }
    })
  }

  // 3. Render a loading state to prevent the form from flashing for guests
  if (role !== 'student') {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Register a New Club</CardTitle>
          <CardDescription>Fill out the details below. Your club will be submitted for verification by an admin.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Club Name</FormLabel>
                  <FormControl><Input placeholder="e.g., The Coding Wizards" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {CLUB_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Describe the mission and activities of your club..." className="min-h-[120px]" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit for Verification
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}