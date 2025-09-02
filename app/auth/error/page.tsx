'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ErrorPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const errorMessage =
    searchParams.get('error') ||
    'An unexpected error occurred. Please try again.'

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-background/30 border rounded-2xl p-8 text-center animate-fade-in-up">
        <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Authentication Failed
        </h1>
        <p className="text-muted-foreground mb-6">
          {errorMessage}
        </p>
        <Button
          onClick={() => router.push('/auth/login')}
          variant="destructive"
          className="w-full"
        >
          Back to Sign In
        </Button>
      </div>
    </div>
  )
}