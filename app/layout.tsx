import './globals.css'
import type { Metadata } from 'next'
import localFont from "next/font/local"
import { AuthProvider } from '@/hooks/useAuth'
import { ThemeProvider } from '../components/providers/ThemeProvider'
import { Navbar } from '../components/layout/Navbar'
import { Toaster } from '@/components/ui/sonner'
import { createClient } from '@/lib/supabase/server'
import { cn } from '@/lib/utils' // Utility for combining class names
import { QueryProvider } from '../components/providers/QueryProvider'

// Your custom font definition
const nunito = localFont({
  src: [
    {
      path: "../public/nunito-fonts/static/Nunito-Regular.ttf", // Adjusted path
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/nunito-fonts/static/Nunito-Bold.ttf", // Adjusted path
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-nunito",
})

export const metadata: Metadata = {
  title: 'CampusPlus - Never Miss a Campus Event',
  description: 'Stay updated with all campus events and connect with your university community',
  keywords: 'university, campus, events, students, clubs',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // 1. REMOVED `await`: The server client function is synchronous
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="en" suppressHydrationWarning>
      {/* 2. USED `cn` UTILITY: Safely merge font class with background class */}
      <body className={cn("main-background", nunito.variable)}>
        {/* 3. CONFIGURED `ThemeProvider`: Added required props */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <AuthProvider initialUser={user}>
              <Navbar />
              <main className="pt-20"> {/* Increased padding slightly for the fixed navbar */}
                {children}
              </main>
              <Toaster position="top-center" richColors />
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}