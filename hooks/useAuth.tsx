'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  role: 'student' | 'guest'
  logOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser: User | null
}) {
  const supabase = createClient()

  // Initialize state directly from the server-provided props
  const [user, setUser] = useState<User | null>(initialUser)
  const [role, setRole] = useState<'student' | 'guest'>(
    initialUser?.user_metadata?.school_id ? 'student' : 'guest'
  )

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user ?? null
        setUser(currentUser)

        // Set the role instantly by checking the user's metadata from the token
        setRole(currentUser?.user_metadata?.school_id ? 'student' : 'guest')
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const logOut = async () => {
    await supabase.auth.signOut()
    // State will be cleared by the onAuthStateChange listener
  }

  const value = { user, role, logOut }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}