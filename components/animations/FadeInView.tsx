'use client'

import { motion } from 'framer-motion'
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'

interface FadeInViewProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}

export function FadeInView({ 
  children, 
  delay = 0, 
  duration = 0.6, 
  className = '' 
}: FadeInViewProps) {
  const { elementRef, hasIntersected } = useIntersectionObserver({
    threshold: 0.1,
  })

  return (
    <motion.div
      ref={elementRef}
      initial={{ opacity: 0, y: 20 }}
      animate={hasIntersected ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ 
        duration, 
        delay,
        ease: [0.21, 1.11, 0.81, 0.99]
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}