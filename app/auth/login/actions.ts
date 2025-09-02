import { createClient } from "@/lib/supabase/server"

export const logIn = async () => {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  return error
}