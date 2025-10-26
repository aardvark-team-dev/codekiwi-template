'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function SignUpForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.message || '회원가입 중 오류가 발생했습니다.')
      } else {
        router.push('/login?message=signup-success')
      }
    } catch (error) {
      setError('네트워크 오류가 발생했습니다.')
      console.error('Sign up error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-neutral-950 text-white overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/5 blur-3xl"></div>
      </div>
      <Card className="w-full max-w-md border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">계정 생성</CardTitle>
          <CardDescription className="text-white/60">시작하기 위해 아래 정보를 입력해주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white/80">이름 (선택)</Label>
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="bg-transparent border-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">이메일 주소</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-transparent border-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="8자 이상 입력"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="bg-transparent border-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/20"
              />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button
              type="submit"
              className="w-full !bg-transparent bg-gradient-to-b from-white via-neutral-200 to-neutral-300 text-neutral-900 ring-1 ring-white/20 hover:bg-gradient-to-b hover:from-neutral-50 hover:via-neutral-200 hover:to-neutral-300"
              disabled={isLoading}
            >
              {isLoading ? '가입하는 중...' : '계속'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center text-sm text-white/70">
          <p>이미 계정이 있으신가요?&nbsp;</p>
          <Link href="/login" className="font-semibold text-white hover:text-white/80">
            로그인하기
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={
      <div className="relative min-h-screen flex items-center justify-center bg-neutral-950 text-white overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-white/5 blur-3xl"></div>
        </div>
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/40 mx-auto mb-4"></div>
          <p className="text-white/80">로딩 중...</p>
        </div>
      </div>
    }>
      <SignUpForm />
    </Suspense>
  )
}
