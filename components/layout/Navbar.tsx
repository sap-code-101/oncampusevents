'use client'

import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu'
import { LayoutDashboard, Compass, LogOut, Moon, Sun, LogInIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { motion } from 'framer-motion'
import { Separator } from '../ui/separator'
import { ThemeToggle } from '../ui/theme-toggle'

// The component no longer accepts any props
export function Navbar() {
  // It gets all necessary data from the hook
  const { user } = useAuth()

  const renderUserMenu = () => {
    if (user) {
      return (
        <div className="flex items-center justify-center gap-2">
          <Button variant="link" asChild>
            <Link href="/explore">
              <Compass className="mr-2 h-5 w-5" /> Explore
            </Link>
          </Button>
          <Button variant="link" asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-5 w-5" /> Dashboard
            </Link>
          </Button>
          <ThemeToggle /> {/* <-- USE THE NEW COMPONENT */}
        </div>
      )
    }

    // Logged-out user view
    return (
      <div className="flex items-center justify-center gap-2">
        <Button variant="link" asChild>
          <Link href="/explore">
            <Compass className="mr-2 h-5 w-5" /> Explore
          </Link>
        </Button>
        <Button variant="link" asChild>
          <Link href="/about-us">
            <LogInIcon className="mr-2 h-5 w-5" /> About Us
          </Link>
        </Button>
        <ThemeToggle /> {/* <-- USE THE NEW COMPONENT */}
      </div>
    )
  }



  return (
    <header className="fixed main-background top-0 left-0 right-0 z-50 p-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">

          <span className="text-lg font-bold text-primary">Campus Connect</span>
          {/* <span className="text-xl font-bold text-primary hidden sm:inline-block">
            ampusPlus
          </span> */}
        </Link>
        {renderUserMenu()}
      </div>
    </header>
  )
}