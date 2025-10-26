'use client'
import { useSession } from 'next-auth/react'

export function SignedIn({ children }: { children: React.ReactNode }) {
  const { status } = useSession({ required: false })
  
  if (status === 'authenticated') {
    return <>{children}</>
  }
  
  return null
}
