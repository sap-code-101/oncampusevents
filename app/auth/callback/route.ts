import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // let errorMes;

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // On success, redirect to the app's home page or the 'next' path
      return NextResponse.redirect(`${origin}/`)
    }
    // errorMes = error;
  }

  // On error, create a clean redirect URL to your error page
  const errorRedirectUrl = new URL('/auth/error', origin)
  errorRedirectUrl.searchParams.set('error', "Sorry, we failed to authenticate you.")
  return NextResponse.redirect(errorRedirectUrl)
}