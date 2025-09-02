'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { clubSchema, ClubSchemaType } from '@/lib/validations'

export async function registerClubAction(values: ClubSchemaType) {
  const supabase = await createClient()

  // 1. Get the current user from the session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: "Authentication error: You must be logged in." }
  }

  // --- NEW STEP: Fetch the student's profile from the database ---
  // This is the guaranteed source of truth for the school_id.
  const { data: studentProfile, error: profileError } = await supabase
    .from('students')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (profileError || !studentProfile) {
    console.error("Supabase query error:", profileError)
    return { error: "Could not find a student profile for your account." }
  }
  // --- END NEW STEP ---

  // 2. Validate the form fields
  const validatedFields = clubSchema.safeParse(values)
  if (!validatedFields.success) {
    return { error: "Invalid form data. Please check your inputs." }
  }
  const { name, description, category } = validatedFields.data

  // 3. Insert the new club into the database using the TRUSTED school_id
  const { error: insertError } = await supabase.from('clubs').insert({
    name,
    description,
    category,
    leader_id: user.id,
    school_id: studentProfile.school_id, // <-- Use the ID from the database
  })

  if (insertError) {
    console.error("Supabase insert error:", insertError)
    return { error: "Database error: Could not register the club. The name might already be taken." }
  }

  // 4. On success, revalidate paths and redirect
  revalidatePath('/dashboard')
  redirect('/clubs/register/success')
}