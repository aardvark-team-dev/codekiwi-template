# 데이터베이스 관리 스크립트

개발 과정에서 데이터베이스를 초기화하고 테스트 데이터를 생성하는 스크립트입니다.

## 📋 스크립트 목록

### `create-admin.ts` - Admin 계정 생성
특정 이메일로 Admin 계정을 생성하거나 기존 계정에 Admin 권한을 부여합니다.

```bash
npx tsx scripts/create-admin.ts <email> <password> <name>
```

**예시:**
```bash
npx tsx scripts/create-admin.ts admin@codekiwi.ai password123 "관리자"
```

**사용 시나리오:**
- 프로젝트 초기화 시 첫 Admin 계정 생성
- 기존 사용자에게 Admin 권한 부여
- 추가 관리자 계정 생성

### `seed-dev.ts` - 시드 데이터 추가
기존 데이터베이스에 테스트 사용자를 추가합니다. 이미 존재하는 사용자는 건너뜁니다.

```bash
npm run db:seed
```

**사용 시나리오:**
- DB는 있지만 테스트 유저가 필요할 때
- 특정 테스트 계정을 추가하고 싶을 때

### `reset-dev.ts` - 완전 리셋
데이터베이스 파일을 완전히 삭제하고 새로 생성한 후 시드 데이터를 넣습니다.

```bash
npm run db:reset
```

**사용 시나리오:**
- 스키마 변경 후 깨끗하게 시작하고 싶을 때
- DB 파일이 손상되었을 때
- 모든 데이터를 완전히 초기화하고 싶을 때

## 🧪 테스트 계정

스크립트 실행 후 다음 계정으로 로그인할 수 있습니다:

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 👤 일반 사용자 | `test@example.com` | `test1234` |
| 👑 관리자 | `admin@example.com` | `admin1234` |

## 🔧 커스터마이징

`scripts/seed-dev.ts` 파일의 `SEED_USERS` 배열을 수정하면 원하는 테스트 계정을 추가할 수 있습니다:

```typescript
const SEED_USERS: SeedUser[] = [
  {
    email: 'your@email.com',
    password: 'your-password',
    name: '사용자 이름',
    isAdmin: false
  }
]
```

## 🚨 주의사항

- 이 스크립트들은 **개발 환경**(`NODE_ENV !== 'production'`)에서만 사용하세요
- 프로덕션 데이터베이스에는 절대 사용하지 마세요
- `npm run db:reset`은 모든 데이터를 삭제합니다

## 🔄 일반적인 워크플로우

### DB 삭제 후 개발 재시작
```bash
# 1. DB 리셋 (테이블 재생성 + 시드 데이터)
npm run db:reset

# 2. 개발 서버 시작
npm run dev
```

### 기존 DB에 테스트 유저만 추가
```bash
# 시드 데이터만 추가 (DB는 그대로)
npm run db:seed

# 개발 서버 시작
npm run dev
```

## 🏗️ 기술적 세부사항

- **TypeScript**: domain types와 로직을 재사용
- **tsx**: TypeScript를 직접 실행 (컴파일 불필요)
- **Domain Layer**: `UserService`를 활용하여 비즈니스 로직 일관성 유지
- **자동 테이블 생성**: `getDatabase()`가 호출되면 자동으로 모든 테이블 생성

