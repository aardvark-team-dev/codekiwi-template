'use client'

import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'

export function UserButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <Skeleton className="h-9 w-9 rounded-full" />
  }

  if (status === 'unauthenticated') {
    return null
  }

  const name = session?.user?.name as string | undefined
  const email = (session?.user?.email as string | undefined) || ''
  const firstLetter = (name || email || '?').charAt(0).toUpperCase()
  const image = (session?.user as { image?: string } | undefined)?.image

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label="사용자 메뉴" className="inline-flex items-center justify-center">
          <Avatar>
            {image ? (
              <AvatarImage src={image} alt={name || email} />
            ) : (
              <AvatarFallback>{firstLetter}</AvatarFallback>
            )}
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex items-center gap-3">
            <Avatar className="size-8">
              {image ? (
                <AvatarImage src={image} alt={name || email} />
              ) : (
                <AvatarFallback>{firstLetter}</AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0">
              {name && <div className="text-sm font-medium truncate">{name}</div>}
              <div className="text-xs text-muted-foreground truncate">{email}</div>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => signOut({ callbackUrl: '/' })}>
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
