import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle2 } from 'lucide-react'

export default function ClubRegistrationSuccess() {
  return (
    <div className="flex flex-col items-center justify-center text-center min-h-[calc(100vh-8rem)] px-4">
      <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
      <h1 className="text-3xl font-bold mb-2">Submission Received!</h1>
      <p className="text-muted-foreground max-w-md mb-6">
        Your club registration has been submitted and is now pending verification. An administrator will review it shortly.
      </p>
      <div className="flex gap-4">
        <Link href="/"><Button>Go Home</Button></Link>
        <Link href="/dashboard"><Button variant="outline">View Dashboard</Button></Link>
      </div>
    </div>
  )
}