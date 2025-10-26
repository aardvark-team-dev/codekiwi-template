'use client'
import { useSession } from 'next-auth/react'
import { ReactNode } from 'react'

export function SignedOut({ children }: { children: ReactNode }) {
  const { status } = useSession({ required: false })

  if (status === 'unauthenticated') {
    return <>{children}</>
  }

  return null
}
