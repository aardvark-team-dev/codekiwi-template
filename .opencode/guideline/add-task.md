# Add Task Guideline

## 목적
새로운 기능 요청을 tasks.yaml에 추가하는 가이드라인

## 언제 사용하는가?
- 유저가 완전히 새로운 기능을 요청할 때 (CASE 1)
- 기존 task와 무관한 독립적인 기능일 때

## 프로세스

### 1. 유저 요청 분석
```
유저 입력 → 기능 이해 → User Story 도출
```

**확인 사항:**
- 누가 (사용자), 무엇을 (목적), 어떻게 (기능) 할 것인가?
- 기존 task와 의존 관계가 있는가?
- 우선순위는 어떻게 되는가?

### 2. AcceptanceCriteria 식별

**명확한 요구사항만 AC로 추가:**
- ✅ 유저가 명시적으로 언급한 것
- ✅ 비즈니스 로직상 명백한 것
- ✅ 기술적으로 명확한 것

**예시 - 좋은 AC:**
```yaml
acceptanceCriteria:
  - description: "등록된 알바생 목록을 한눈에 확인할 수 있다"
    acRisk: 0.08  # 단순 CRUD 조회
  - description: "회원가입 완료 후 바로 서비스 메인 화면으로 이동한다"
    acRisk: 0.05  # 단순 리다이렉트
```

**acRisk 산정 기준:**
- 0.00~0.10: 단순 CRUD, 기본 UI
- 0.10~0.20: 중간 복잡도 로직
- 0.20~0.30: 복잡한 비즈니스 로직
- 0.30+: 매우 복잡하거나 외부 의존성 많음

### 3. Uncertainty 식별

**불확실한 것은 Uncertainty로:**
- ❓ 유저에게 확인이 필요한 것
- ❓ 여러 구현 방법이 있는 것
- ❓ 기술적 선택이 필요한 것

**Uncertainty 타입:**
1. **기획적 불확실성**: 비즈니스 로직, 엣지 케이스
2. **기술적 불확실성**: 외부 API, 라이브러리 선택
3. **의존성 불확실성**: 선행 기능 미완성, 인터페이스 불명확

### 4. AcCandidate 구성

**각 Uncertainty마다 2~4개의 선택지 제시:**

```yaml
uncertainties:
  - description: "본인 확인 방법 (기술적)"
    uncertRisk: 0.30  # max(0.10, 0.30, 0.25) = 0.30
    acCandidates:
      - description: "이메일 인증만 사용"
        acRiskIfSelected: 0.10
        pros:
          - "구현이 단순함"
          - "외부 API 불필요"
        cons:
          - "보안이 약함"
      
      - description: "휴대폰 인증 사용 (SMS API)"
        acRiskIfSelected: 0.30
        pros:
          - "보안이 강함"
        cons:
          - "외부 API 필요 (비용 발생)"
      
      - description: "소셜 로그인 (카카오/네이버)"
        acRiskIfSelected: 0.25
        pros:
          - "사용자 편의성 높음"
        cons:
          - "OAuth 연동 필요"
```

**acRiskIfSelected 산정:**
- 0.00~0.10: 단순한 선택
- 0.10~0.20: 중간 복잡도
- 0.20~0.30: 복잡한 구현
- 0.30+: 매우 복잡 (외부 API, 새 도메인 등)

**pros/cons 작성:**
- 비개발자도 이해 가능한 용어 사용
- 구체적이고 실용적인 내용
- 기술 용어 사용 시 괄호로 설명 추가

### 5. Risk 검증

```
risk = sum(acRisk) + sum(uncertRisk)
```

**목표:**
- risk < 0.3: 즉시 개발 가능 ✅
- 0.3 ≤ risk < 0.6: 구체화 후 개발 가능 ⚠️
- risk ≥ 0.6: 많은 구체화 필요 🔴

**예시 계산:**
```yaml
US-001 회원가입:
  acceptanceCriteria: [0.05]
  uncertainties: [0.30, 0.25, 0.15]
  risk = 0.05 + 0.30 + 0.25 + 0.15 = 0.75
```

### 6. Tool 호출

```typescript
addTask({
  title: "회원가입",
  userStoryId: "US-001",
  userStory: "[소상공인 사장님]으로서, [급여 관리 서비스를 이용]하기 위해 [회원가입]할 수 있다.",
  acceptanceCriteria: [
    {
      description: "회원가입 완료 후 바로 서비스 메인 화면으로 이동한다",
      acRisk: 0.05
    }
  ],
  uncertainties: [
    {
      description: "본인 확인 방법 (기술적)",
      acCandidates: [
        {
          description: "이메일 인증만 사용",
          acRiskIfSelected: 0.10,
          pros: ["구현이 단순함", "외부 API 불필요"],
          cons: ["보안이 약함"]
        },
        // ... more candidates
      ]
    }
  ],
  priority: "P0",
  dependencies: []
})
```

## 체크리스트

### 요청 분석
- [ ] User Story를 "[사용자]로서, [목적]을 위해 [기능]을 할 수 있다" 형식으로 작성
- [ ] userStoryId가 중복되지 않는지 확인
- [ ] dependencies 확인 (선행 task 필요한지)

### AcceptanceCriteria
- [ ] 명확하고 확정된 요구사항만 포함
- [ ] 각 AC의 acRisk 산정 (0 이상)
- [ ] description은 비개발자도 이해 가능한 문장

### Uncertainty
- [ ] 불확실한 것만 포함
- [ ] description에 타입 명시 (기획적|기술적|의존성)
- [ ] 각 uncertainty마다 2~4개의 acCandidate 제시
- [ ] uncertRisk는 자동 계산됨 (max of acRiskIfSelected)

### AcCandidate
- [ ] description은 구체적이고 실행 가능한 선택지
- [ ] acRiskIfSelected 산정 (0 이상)
- [ ] pros/cons는 비개발자 이해 가능
- [ ] 최소 2개, 최대 4개

### Risk
- [ ] risk = sum(acRisk) + sum(uncertRisk)
- [ ] risk가 자동 계산되는지 확인

### 기타
- [ ] priority 설정 (P0/P1/P2)
- [ ] dependencies 배열 작성
- [ ] status는 "개발 전"으로 자동 설정됨

## 주의사항

1. **가정하지 말 것**: 불확실하면 uncertainty로 추가
2. **비개발자 관점**: 모든 description, pros, cons는 비기술 용어 사용
3. **구체적으로**: "인증 방법"보다 "이메일 인증만 사용" 같이 구체적으로
4. **acRisk 보수적 산정**: 애매하면 높게 책정
5. **uncertRisk 자동 계산**: max(acRiskIfSelected)로 자동 계산되므로 직접 입력 불필요

### ⚠️ Agent 필수 입력 사항

**Agent가 addTask tool을 사용할 때는 다음 필드들을 반드시 채워야 합니다:**

- ✅ **acRisk**: 각 AcceptanceCriteria의 복잡도 (≥ 0)
- ✅ **acRiskIfSelected**: 각 AcCandidate의 선택 시 복잡도 (≥ 0)  
- ✅ **acCandidates**: 각 Uncertainty의 선택지 배열 (최소 2개)
- ✅ **uncertainties**: 불확실성 배열 (불확실성이 없어도 빈 배열 `[]`로 명시)
- ✅ **priority**: 우선순위 (P0/P1/P2 중 하나 필수)
- ✅ **dependencies**: 의존성 배열 (의존성이 없어도 빈 배열 `[]`로 명시)

**이유:**
- 사용자가 tasks.yaml을 최초로 작성할 때는 이 필드들을 비워둘 수 있음 (isInitialTask: true)
- 하지만 agent가 tool을 사용할 때는 위험도 평가가 완료된 상태여야 함
- 이 필드들이 없으면 risk 계산이 불가능하여 개발 여부 판단을 할 수 없음

**잘못된 예시:**
```typescript
// ❌ 이렇게 하면 안 됨
addTask({
  title: "회원가입",
  userStoryId: "US-001",
  userStory: "...",
  acceptanceCriteria: [
    { description: "회원가입 완료 후 메인 화면 이동" }  // acRisk 없음!
  ]
  // uncertainties, priority, dependencies 누락!
})
```

**올바른 예시:**
```typescript
// ✅ Agent는 반드시 모든 필수 필드 포함
addTask({
  title: "회원가입",
  userStoryId: "US-001",
  userStory: "...",
  acceptanceCriteria: [
    { 
      description: "회원가입 완료 후 메인 화면 이동",
      acRisk: 0.0  // 필수!
    }
  ],
  uncertainties: [],  // 필수! (없어도 빈 배열)
  priority: "P0",     // 필수!
  dependencies: []    // 필수! (없어도 빈 배열)
})
```

## 나쁜 예시 vs 좋은 예시

### ❌ 나쁜 예시
```yaml
acceptanceCriteria:
  - description: "회원가입"  # 너무 모호
    acRisk: 0.5  # 구체적 근거 없음
uncertainties:
  - description: "인증"  # 타입 누락, 불명확
    acCandidates:
      - description: "방법 1"  # 무엇인지 알 수 없음
        acRiskIfSelected: 0.1
```

### ✅ 좋은 예시
```yaml
acceptanceCriteria:
  - description: "회원가입 완료 후 바로 서비스 메인 화면으로 이동한다"
    acRisk: 0.05  # 단순 리다이렉트
uncertainties:
  - description: "본인 확인 방법 (기술적)"
    acCandidates:
      - description: "이메일 인증만 사용"
        acRiskIfSelected: 0.10
        pros: ["구현이 단순함"]
        cons: ["보안이 약함"]
```

## 자주 하는 실수

1. **AC와 Uncertainty 혼동**
   - AC: 명확하고 확정된 것
   - Uncertainty: 불확실하고 선택이 필요한 것

2. **acRisk 누락**
   - ❌ tool 사용 시 acRisk 생략
   - ✅ 반드시 모든 AC에 acRisk 포함

3. **uncertRisk 직접 계산**
   - ❌ 직접 입력하면 안 됨
   - ✅ max(acRiskIfSelected)로 자동 계산됨

4. **acCandidates 누락**
   - ❌ uncertainty 추가 시 acCandidates 생략
   - ✅ 반드시 각 uncertainty에 acCandidates 배열 포함

5. **uncertainties 누락**
   - ❌ tool 사용 시 uncertainties 파라미터 생략
   - ✅ 반드시 uncertainties 포함 (없어도 `[]`)

6. **priority 누락**
   - ❌ tool 사용 시 priority 생략
   - ✅ 반드시 priority 포함 (P0/P1/P2)

7. **dependencies 누락**
   - ❌ tool 사용 시 dependencies 파라미터 생략
   - ✅ 반드시 dependencies 포함 (없어도 `[]`)

8. **선택지 부족**
   - ❌ 1개만 제시
   - ✅ 2~4개 제시

9. **pros/cons 생략**
   - ❌ 선택지만 나열
   - ✅ 각 선택지의 장단점 명시

