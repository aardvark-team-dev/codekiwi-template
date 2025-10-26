===
CODEKIWI NEXT.JS TEMPLATE v1
===

# 셋업 프로세스 (cmd 기준)
1. 기능 설명 (YAML)을 tasks.yaml에 붙여넣기
2. npm i
3. npx auth secret
4. npm run dev (만약 5를 같은 터미널에서 진행하고 싶다면 start /B cmd /C "npm run dev")
5. (새로운 터미널에서) opencode
6. (opencode 터미널에서) /init

- Agentic Development System: OpenCode

- Agents
    - Claude 4.5 Sonnet

- DB: Sqlite
- Auth: Auth.js v5
- UI: shadcn/ui


[개발 서버 실행 프로세스]
npx auth secret -y
npm run db:reset
npm run dev


1. Auth 구조:
NextAuth v5를 사용
Credentials 방식 로그인
email/password로 인증
UserService를 통해 DB에서 사용자 확인

2. 사전 구성된 컴포넌트:
<SignedIn>: 로그인된 사용자에게만 표시
<SignedOut>: 로그아웃 상태에서만 표시
<SignInButton>: /login으로 이동하는 버튼
<UserButton>: 로그인한 사용자 정보와 로그아웃 드롭다운

3. 사전 구성된 페이지:
/login: 글래스모피즘 스타일의 로그인 페이지 (이메일, 비밀번호)
/signup: 글래스모피즘 스타일의 회원가입 페이지 (이름(선택), 이메일, 비밀번호)

4. API 엔드포인트:
/api/auth/[...nextauth]: NextAuth 핸들러
/api/auth/register: 회원가입 API

5. Middleware:
인증되지 않은 사용자는 /login으로 리다이렉트
기본 공개 경로: /login, /signup 및 /codekiwi-dashboard (개발 대시보드)
/codekiwi-dashboard 라우트는 실제 배포시 삭제 예정