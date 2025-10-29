# Auth.js v5 인증 가이드

> 이 프로젝트는 Auth.js v5와 Next.js 15를 사용합니다.  
> SQLite DB + Credentials Provider (이메일/비밀번호) 방식으로 구현되어 있습니다.

---

## 📂 파일 구조

```
src/
├── auth.config.ts       # Edge Runtime 설정 (middleware용)
├── auth.ts              # 전체 Auth 설정 (DB 접근 가능)
├── middleware.ts        # Next.js middleware (경로 보호)
└── lib/
    └── auth-helpers.ts  # 서버 컴포넌트용 헬퍼 함수
```

---

## 🔐 인증 흐름

### 1️⃣ 로그인 프로세스

```
사용자 로그인 시도
    ↓
[auth.ts] Credentials Provider의 authorize() 함수 실행
    ↓
DB에서 사용자 조회 (UserService)
    ↓
비밀번호 검증
    ↓
[auth.ts] jwt callback - user 정보를 JWT token에 저장
    ↓
[auth.ts] session callback - token 정보를 session에 복사
    ↓
클라이언트에서 useSession()으로 session 접근 가능
```

### 2️⃣ 경로 보호 프로세스

```
사용자가 /dashboard 접근 시도
    ↓
[middleware.ts] Next.js middleware 실행 (Edge Runtime)
    ↓
[auth.config.ts] authorized callback 호출
    ↓
공개 경로 체크 (publicPaths)
    ↓
인증 여부 체크 (!!auth)
    ↓
false 반환 → Auth.js가 자동으로 /login으로 리다이렉트
true 반환 → 요청 통과
```

---

## 📝 파일별 상세 설명

### `auth.config.ts` - Edge Runtime 설정

**🎯 용도:**
- Middleware에서 사용되는 Edge-compatible 설정
- **DB adapter를 포함하면 안 됩니다** (Edge Runtime 제약)

**📌 주요 구성:**

```typescript
export default {
  providers: [],  // 실제 providers는 auth.ts에서 정의
  pages: {
    signIn: '/login',  // 로그인 페이지 경로
  },
  callbacks: {
    authorized: async ({ auth, request }) => {
      // 경로별 접근 권한 제어
    }
  }
}
```

**✏️ 공개 경로 추가하는 법:**

```typescript
const publicPaths = [
  '/',
  '/login',
  '/signup',
  '/about',        // ← 새 공개 경로 추가
  '/contact',      // ← 새 공개 경로 추가
]
```

**⚠️ 주의사항:**
- DB 접근 코드 금지
- 외부 API 호출 최소화
- 가벼운 로직만 작성

---

### `auth.ts` - 전체 Auth 설정

**🎯 용도:**
- Credentials Provider 정의
- DB 접근 로직 (authorize 함수)
- Session/JWT 관리

**📌 주요 구성:**

```typescript
export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      authorize: async (credentials) => {
        // 1. 입력값 검증 (Zod)
        // 2. DB에서 사용자 조회
        // 3. 비밀번호 검증
        // 4. SessionUser 객체 반환
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      // user 정보를 token에 저장
    },
    session: async ({ session, token }) => {
      // token 정보를 session에 복사
    }
  }
})
```

**✏️ 비밀번호 검증 로직 수정:**

```typescript
// authorize 함수 내부
const isValidPassword = await userService.verifyPassword(
  password,
  user.password || ''
)

if (!isValidPassword) {
  throw new Error("Invalid credentials.")
}
```

**✏️ Session에 추가 정보 넣기:**

```typescript
// SessionUser 타입에 필드 추가 (domain/user/types.ts)
export interface SessionUser {
  id: string
  email: string
  name?: string | null
  isAdmin: boolean
  newField: string  // ← 새 필드 추가
}

// authorize 함수에서 반환할 때 포함
return {
  id: user.id,
  email: user.email,
  name: user.name,
  isAdmin: isAdmin,
  newField: "value"  // ← 새 필드 값 설정
}
```

---

### `middleware.ts` - Next.js Middleware

**🎯 용도:**
- 모든 요청을 가로채서 인증 체크
- Edge Runtime에서 실행

**📌 현재 구현:**

```typescript
export { auth as middleware } from "@/auth"

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|ico|webp)).*)',
  ],
}
```

**✏️ 정적 리소스 추가 제외:**

```typescript
export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public|.*\\.(?:jpg|jpeg|gif|png|svg|ico|webp|pdf)).*)',
    //                                                    ^^^^^^       ^^^
    //                                                    추가 경로    추가 확장자
  ],
}
```

**⚠️ 중요:**
- **공개/비공개 경로 제어는 `auth.config.ts`에서 합니다!**
- matcher는 middleware 실행 여부만 결정합니다

---

### `lib/auth-helpers.ts` - 서버 컴포넌트용 헬퍼

**🎯 용도:**
- Server Component에서 인증 체크
- 권한 체크 후 리다이렉트

**📌 주요 함수:**

```typescript
// 관리자만 접근 가능한 페이지
export async function requireAdmin(redirectTo = '/unauthorized')

// 로그인한 사용자만 접근 가능한 페이지
export async function requireAuth(redirectTo = '/login')

// 관리자 여부만 확인 (리다이렉트 없음)
export async function checkIsAdmin(): Promise<boolean>
```

**✏️ Server Component에서 사용 예시:**

```typescript
// app/admin/page.tsx
import { requireAdmin } from '@/lib/auth-helpers'

export default async function AdminPage() {
  const session = await requireAdmin()  // 관리자 아니면 리다이렉트
  
  return (
    <div>
      <h1>관리자 대시보드</h1>
      <p>환영합니다, {session.user.name}님</p>
    </div>
  )
}
```

```typescript
// app/profile/page.tsx
import { requireAuth } from '@/lib/auth-helpers'

export default async function ProfilePage() {
  const session = await requireAuth()  // 로그인 안 했으면 /login으로
  
  return (
    <div>
      <h1>내 프로필</h1>
      <p>{session.user.email}</p>
    </div>
  )
}
```

---

## 🔧 자주하는 작업들

### 1. 새로운 공개 경로 추가하기

**파일:** `src/auth.config.ts`

```typescript
const publicPaths = [
  '/',
  '/login',
  '/signup',
  '/your-new-page',  // ← 여기에 추가
]
```

### 2. 새로운 보호된 경로 추가하기

**기본적으로 모든 경로는 보호됩니다.**  
공개 경로 목록에 없으면 자동으로 로그인 필요!

### 3. 관리자만 접근 가능한 페이지 만들기

**Option A: Server Component**

```typescript
// app/admin/users/page.tsx
import { requireAdmin } from '@/lib/auth-helpers'

export default async function AdminUsersPage() {
  await requireAdmin()  // 관리자 체크
  
  return <div>관리자 전용 페이지</div>
}
```

**Option B: Client Component**

```typescript
// app/admin/users/page.tsx
import { AdminOnly } from '@/components/auth/AdminOnly'

export default function AdminUsersPage() {
  return (
    <AdminOnly>
      <div>관리자 전용 페이지</div>
    </AdminOnly>
  )
}
```

### 4. 로그인/로그아웃 구현

**로그인 폼:**

```typescript
'use client'
import { signIn } from 'next-auth/react'

export function LoginForm() {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/dashboard',
    })
  }
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit">로그인</button>
    </form>
  )
}
```

**로그아웃 버튼:**

```typescript
'use client'
import { signOut } from 'next-auth/react'

export function LogoutButton() {
  return (
    <button onClick={() => signOut({ redirectTo: '/' })}>
      로그아웃
    </button>
  )
}
```

### 5. 현재 사용자 정보 가져오기

**Server Component:**

```typescript
import { auth } from '@/auth'

export default async function MyPage() {
  const session = await auth()
  
  if (!session) {
    return <div>로그인 필요</div>
  }
  
  return <div>환영합니다, {session.user.name}님</div>
}
```

**Client Component:**

```typescript
'use client'
import { useSession } from 'next-auth/react'

export function UserProfile() {
  const { data: session, status } = useSession()
  
  if (status === 'loading') {
    return <div>로딩중...</div>
  }
  
  if (!session) {
    return <div>로그인 필요</div>
  }
  
  return <div>환영합니다, {session.user.name}님</div>
}
```

---

## 🚫 Edge Runtime 제약사항

### Edge Runtime이란?

- Next.js middleware는 **Edge Runtime**에서 실행됩니다
- Edge Runtime은 제약이 많은 경량 환경입니다

### 금지된 것들

❌ **Database 직접 접근**
```typescript
// middleware.ts 또는 auth.config.ts에서 금지!
const db = new Database()  // ❌ 안됨!
```

❌ **Node.js 전용 API**
```typescript
import fs from 'fs'  // ❌ Edge Runtime에서 안됨
import crypto from 'crypto'  // ❌ 일부만 지원
```

❌ **무거운 라이브러리**
```typescript
import bcrypt from 'bcrypt'  // ❌ Edge Runtime에서 안됨
```

### 해결 방법

✅ **auth.ts에서 DB 접근**
```typescript
// auth.ts (Node.js Runtime)
providers: [
  Credentials({
    authorize: async (credentials) => {
      const user = userService.getUserByEmail(email)  // ✅ 여기서는 OK!
      return user
    }
  })
]
```

✅ **API Route에서 처리**
```typescript
// app/api/users/route.ts (Node.js Runtime)
export async function GET() {
  const db = new Database()  // ✅ API Route에서는 OK!
  const users = db.getAllUsers()
  return Response.json(users)
}
```

---

## 🎨 컴포넌트 사용 가이드

### `<SignedIn>` - 로그인한 사용자에게만 표시

```typescript
import { SignedIn } from '@/components/auth/SignedIn'

<SignedIn>
  <div>로그인한 사용자만 볼 수 있습니다</div>
</SignedIn>
```

### `<SignedOut>` - 비로그인 사용자에게만 표시

```typescript
import { SignedOut } from '@/components/auth/SignedOut'

<SignedOut>
  <a href="/login">로그인하세요</a>
</SignedOut>
```

### `<AdminOnly>` - 관리자에게만 표시

```typescript
import { AdminOnly } from '@/components/auth/AdminOnly'

<AdminOnly>
  <div>관리자 전용 컨텐츠</div>
</AdminOnly>
```

### 조합해서 사용하기

```typescript
export default function Header() {
  return (
    <header>
      <SignedOut>
        <a href="/login">로그인</a>
      </SignedOut>
      
      <SignedIn>
        <UserButton />
        
        <AdminOnly>
          <a href="/admin">관리자 패널</a>
        </AdminOnly>
      </SignedIn>
    </header>
  )
}
```

---

## 🐛 트러블슈팅

### "Cannot access database in edge runtime"

**원인:** middleware나 auth.config.ts에서 DB에 접근하려고 시도

**해결:**
- DB 접근 코드를 `auth.ts`의 `authorize` 함수로 이동
- 또는 API Route로 이동

### 로그인 후에도 계속 로그인 페이지로 리다이렉트됨

**원인:** `auth.config.ts`의 `publicPaths`에 `/login`이 없음

**해결:**
```typescript
const publicPaths = [
  '/login',  // ← 이거 있는지 확인
  '/signup',
]
```

### Session이 null로 나옴

**원인:**
1. `AuthSessionProvider`로 감싸지 않음
2. Server Component에서 `useSession()` 사용 (안됨!)

**해결:**

```typescript
// app/layout.tsx
import { AuthSessionProvider } from '@/components/AuthSessionProvider'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthSessionProvider>
          {children}
        </AuthSessionProvider>
      </body>
    </html>
  )
}
```

### `authorized` callback이 실행 안됨

**원인:** middleware.ts의 matcher가 해당 경로를 제외시킴

**해결:**
- `middleware.ts`의 `config.matcher` 확인
- 정적 리소스가 아니면 matcher에 포함되어야 함

---

## 📚 추가 자료

- [Auth.js 공식 문서](https://authjs.dev)
- [Next.js 15 Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [Edge Runtime 제약사항](https://nextjs.org/docs/app/api-reference/edge)

---

## ✅ 체크리스트

새로운 기능 추가 시 확인사항:

- [ ] 공개 경로면 `auth.config.ts`의 `publicPaths`에 추가했는가?
- [ ] DB 접근 코드가 `auth.config.ts`나 `middleware.ts`에 없는가?
- [ ] Session에 새 필드 추가 시 타입도 함께 수정했는가?
- [ ] 관리자 전용 기능이면 `requireAdmin()` 또는 `<AdminOnly>` 사용했는가?
- [ ] Client Component에서 session 사용 시 `useSession()` 사용했는가?

---

**질문이나 문제가 있으면 이 문서를 먼저 확인하세요!** 🚀

