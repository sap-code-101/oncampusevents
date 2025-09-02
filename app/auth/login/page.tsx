'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, GraduationCap } from 'lucide-react'
import { logIn } from './actions'

export default function LoginPage() {
  const supabase = createClient()
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    const error = await logIn()
    if (error) {
      toast.error("Sorry Failed to login")
    }
    setIsLoading(false)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background/30 flex items-center justify-center p-4">
      <div className="w-full max-w-sm  border rounded-2xl p-8 animate-fade-in-up">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="bg-primary/10 p-3 rounded-full mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold gradient-text">
            Welcome
          </h1>
          <p className="text-muted-foreground mt-2">
            Sign in with your university Google account to continue.
          </p>
        </div>

        <Button
          onClick={handleGoogleSignIn}
          className="w-full h-12 rounded-xl text-base font-medium border"
          variant="outline"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {/* Official Google "G" Logo SVG */}
              <svg
                className="w-4 h-4 mr-2"
                aria-hidden="true"
                focusable="false"
                viewBox="0 0 48 48"
              >
                <path
                  fill="#4285F4"
                  d="M45.12 24.5c0-1.56-.14-3.09-.42-4.58H24.5v8.69h11.53c-.49 2.82-1.96 5.29-4.22 6.98v5.61h7.22c4.22-3.88 6.65-9.7 6.65-16.7z"
                ></path>
                <path
                  fill="#34A853"
                  d="M24.5 48c6.5 0 12-2.16 16-5.79l-7.22-5.61c-2.16 1.45-4.93 2.3-8.78 2.3-6.74 0-12.44-4.53-14.48-10.58H2.5v5.79C6.6 42.6 14.87 48 24.5 48z"
                ></path>
                <path
                  fill="#FBBC05"
                  d="M9.98 29.18c-.49-1.45-.77-2.99-.77-4.58s.28-3.13.77-4.58V14.21H2.5C1.04 17.13 0 21.13 0 24.6c0 3.47 1.04 7.47 2.5 10.39l7.48-5.81z"
                ></path>
                <path
                  fill="#EA4335"
                  d="M24.5 9.4c3.54 0 6.74 1.22 9.24 3.62l6.42-6.42C36.5 2.62 30.5 0 24.5 0 14.87 0 6.6 5.4 2.5 14.21l7.48 5.81C12.06 13.93 17.76 9.4 24.5 9.4z"
                ></path>
              </svg>
              Continue with Google
            </>
          )}
        </Button>
      </div>
    </div>
  )
}