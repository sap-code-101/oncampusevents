import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getSubdomain() {
  if (typeof window === 'undefined') return null

  const hostname = window.location.hostname
  const parts = hostname.split('.')

  // For local development
  if (hostname === 'localhost') return null

  // For production subdomains (e.g., kiit.campusplus.com)
  if (parts.length >= 3) {
    return parts[0]
  }

  return null
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(date))
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function validateEmailDomain(email: string, requiredDomain: string) {
  const emailDomain = "@" + email.split('@')[1]
  return emailDomain === requiredDomain
}

export const clubCategories = [
  'Academic',
  'Arts & Culture',
  'Sports & Fitness',
  'Technology',
  'Social Service',
  'Business & Entrepreneurship',
  'Music & Dance',
  'Drama & Theatre',
  'Photography',
  'Gaming & E-Sports',
  'Environment',
  'Literature',
  'Other',
] as const