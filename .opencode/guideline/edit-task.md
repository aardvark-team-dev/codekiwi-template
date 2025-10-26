# Edit Task Guideline

## 목적
기존 task의 요구사항을 수정하거나 추가하는 가이드라인

## 언제 사용하는가?
- 유저가 기존 기능의 수정/변경/삭제를 요청할 때 (CASE 1의 일부)
- 기존 task에 새로운 요구사항을 추가할 때
- 의존성 불확실성 해결 시 선행 task를 수정해야 할 때

## 프로세스

### 1. 수정 대상 식별

```
유저 요청 → 어떤 task를 수정할 것인가? → userStoryId 확인
```

**확인 사항:**
- 어떤 task를 수정하는가?
- 무엇을 수정하는가? (AC 추가/수정, Uncertainty 추가/수정)
- 다른 task에 영향을 주는가?

### 2. 수정 유형 결정

#### Type A: AcceptanceCriteria 추가
**상황:** 
- 유저가 새로운 명확한 요구사항을 추가
- 의존성 불확실성 해결로 선행 task에 AC 추가 필요

**예시:**
```yaml
# Before
acceptanceCriteria:
  - description: "등록된 알바생 목록을 한눈에 확인할 수 있다"
    acRisk: 0.08

# After (전화번호 필드 추가)
acceptanceCriteria:
  - description: "등록된 알바생 목록을 한눈에 확인할 수 있다"
    acRisk: 0.08
  - description: "알바생의 전화번호를 입력받는다"
    acRisk: 0.05
  - description: "전화번호 형식 검증을 한다 (010-XXXX-XXXX)"
    acRisk: 0.08
```

#### Type B: AcceptanceCriteria 수정
**상황:**
- 기존 AC의 복잡도가 변경됨
- AC 내용이 변경됨

**주의:** AC를 수정하면 risk가 변경됨

#### Type C: Uncertainty 추가
**상황:**
- 새로운 불확실성 발견
- 유저의 추가 질문이 필요함

**예시:**
```yaml
uncertainties:
  - description: "전화번호 수집 목적 (기획적)"
    acCandidates:
      - description: "급여 명세서 발송용으로만 사용"
        acRiskIfSelected: 0.05
        pros: ["명확한 목적"]
        cons: ["다른 용도로 사용 불가"]
      - description: "급여 명세서 + 긴급 연락용"
        acRiskIfSelected: 0.10
        pros: ["다용도 활용"]
        cons: ["개인정보 수집 동의 범위 확대"]
```

#### Type D: Uncertainty 수정
**상황:**
- 기존 uncertainty의 acCandidate 추가/수정
- uncertainty description 명확화

#### Type E: 메타데이터 수정
**상황:**
- title, userStory, priority, dependencies 수정

### 3. Risk 영향 분석

**수정 전후 risk 비교:**
```
Before:
  acceptanceCriteria: [0.08]
  uncertainties: [0.20, 0.15]
  risk = 0.08 + 0.20 + 0.15 = 0.43

After (AC 2개 추가):
  acceptanceCriteria: [0.08, 0.05, 0.08]
  uncertainties: [0.20, 0.15]
  risk = 0.21 + 0.35 = 0.56
```

### 4. 의존성 영향 분석

**이 task에 의존하는 다른 task가 있는가?**

```yaml
# US-002 수정 시
US-002:
  title: "알바생 등록"
  # 전화번호 필드 추가
  
# 영향받는 task
US-003:
  title: "급여 명세서 발송"
  dependencies: [US-002]
  # US-002의 데이터 구조 변경에 영향받음
```

**확인 사항:**
- [ ] 의존하는 task의 uncertainty 해소 가능한가?
- [ ] 해당 task의 risk가 변경되는가?

### 5. Tool 호출

```typescript
editTask({
  userStoryId: "US-002",
  acceptanceCriteria: [
    {
      description: "등록된 알바생 목록을 한눈에 확인할 수 있다",
      acRisk: 0.08
    },
    {
      description: "알바생의 전화번호를 입력받는다",
      acRisk: 0.05
    },
    {
      description: "전화번호 형식 검증을 한다 (010-XXXX-XXXX)",
      acRisk: 0.08
    }
  ]
  // uncertainties는 유지됨 (전체 대체가 아니므로)
})
```

**중요:** editTask는 **전체 대체** 방식
- acceptanceCriteria를 넘기면 → 기존 것 전부 삭제하고 새로 추가
- 일부만 수정하려면 → 기존 것 + 새 것을 모두 포함해서 전달

## 수정 시나리오

### 시나리오 1: 의존성 불확실성 해결

```
상황:
  US-003 "급여 명세서 발송"의 uncertainty:
  - "선행 기능의 데이터 구조 불명확 (의존성)"
  - 유저가 "US-002에 전화번호 필드 추가" 선택

절차:
  1. resolveUncertainty(US-003, 0, 0)  # US-003의 uncertainty 해소
  2. editTask(US-002, ...)  # US-002에 전화번호 관련 AC 추가
  3. US-003의 risk 재계산됨 (uncertainty 제거)
  4. US-002의 risk 재계산됨 (AC 추가)
```

### 시나리오 2: 요구사항 추가

```
상황:
  유저: "알바생 등록할 때 사진도 업로드할 수 있게 해주세요"

절차:
  1. 명확한가? → 아니오 (어떤 사진? 어디에 저장?)
  2. uncertainty로 추가:
     - description: "알바생 사진 관리 (기획적)"
     - acCandidates:
       - "프로필 사진 1장만 저장"
       - "여러 장 저장 (신분증 등)"
  3. editTask(US-002, uncertainties: [...기존, ...새것])
```

### 시나리오 3: 요구사항 삭제

```
상황:
  유저: "전화번호 검증은 안 해도 될 것 같아요"

절차:
  1. acceptanceCriteria에서 해당 항목 제거
  2. editTask(US-002, acceptanceCriteria: [...제거된 목록])
  3. risk 자동 재계산 (감소)
```

## 체크리스트

### 수정 전
- [ ] userStoryId로 대상 task 확인
- [ ] 현재 acceptanceCriteria, uncertainties 읽기
- [ ] 수정 유형 결정 (AC 추가/수정, Uncertainty 추가/수정)
- [ ] 의존하는 task 있는지 확인

### AcceptanceCriteria 수정
- [ ] 전체 목록 준비 (기존 + 새 것, 또는 수정된 것)
- [ ] 각 AC의 acRisk 재산정
- [ ] description 명확한지 확인

### Uncertainty 수정
- [ ] 전체 목록 준비 (기존 + 새 것, 또는 수정된 것)
- [ ] 각 uncertainty의 acCandidates 완전한지 확인
- [ ] pros/cons 작성했는지 확인
- [ ] uncertRisk는 자동 계산됨 (직접 입력 X)

### 수정 후
- [ ] risk가 올바르게 재계산되었는지 확인
- [ ] 의존하는 task의 uncertainty 해소 가능한지 확인

## 주의사항

1. **전체 대체 방식**
   - acceptanceCriteria 수정 시 기존 것도 모두 포함
   - uncertainties 수정 시 기존 것도 모두 포함
   - 일부만 넘기면 나머지는 삭제됨

2. **Risk 자동 재계산**
   - editTask 호출 시 risk는 자동 계산됨
   - 직접 risk 값을 넘기지 않음

3. **UncertRisk 자동 계산**
   - uncertainty 추가/수정 시 uncertRisk 직접 입력하지 않음
   - max(acRiskIfSelected)로 자동 계산됨

4. **Status 변경 주의**
   - status는 Codie agent가 관리
   - 특별한 경우가 아니면 수정하지 않음

5. **의존성 체인 확인**
   - 수정이 다른 task에 영향을 주는지 확인
   - 영향받는 task의 uncertainty를 해소할 수 있는지 확인

### ⚠️ Agent 필수 입력 사항

**Agent가 editTask tool을 사용할 때, 수정하는 필드는 완전히 채워야 합니다:**

**AcceptanceCriteria를 수정하는 경우:**
- ✅ **acRisk**: 각 AcceptanceCriteria의 복잡도 (≥ 0) 필수

**Uncertainties를 수정하는 경우:**
- ✅ **acCandidates**: 각 Uncertainty의 선택지 배열 (최소 2개) 필수
- ✅ **acRiskIfSelected**: 각 AcCandidate의 선택 시 복잡도 (≥ 0) 필수

**기타 필드:**
- editTask 호출 시 수정하지 않는 필드는 생략 가능 (기존 값 유지됨)
- 하지만 수정하는 필드는 완전한 데이터를 제공해야 함

**이유:**
- 사용자가 tasks.yaml을 최초로 작성할 때는 이 필드들을 비워둘 수 있음 (isInitialTask: true)
- 하지만 agent가 tool을 사용할 때는 위험도 평가가 완료된 상태여야 함
- 이 필드들이 없으면 risk 계산이 불가능하여 개발 여부 판단을 할 수 없음

**잘못된 예시:**
```typescript
// ❌ Agent가 이렇게 하면 안 됨 (acRisk 누락)
editTask({
  userStoryId: "US-002",
  acceptanceCriteria: [
    ...기존AC,
    { description: "전화번호를 입력받는다" }
    // acRisk가 없음!
  ]
})
```

**올바른 예시:**
```typescript
// ✅ Agent는 반드시 acRisk 포함
editTask({
  userStoryId: "US-002",
  acceptanceCriteria: [
    ...기존AC,
    { 
      description: "전화번호를 입력받는다",
      acRisk: 0.05  // 필수!
    }
  ]
})
```

## 자주 하는 실수

1. **일부만 전달**
   ```typescript
   // ❌ 잘못된 예시 (기존 AC 날아감)
   editTask({
     userStoryId: "US-002",
     acceptanceCriteria: [
       { description: "새 AC만", acRisk: 0.05 }
     ]
   })
   
   // ✅ 올바른 예시
   editTask({
     userStoryId: "US-002",
     acceptanceCriteria: [
       ...기존AC들,
       { description: "새 AC", acRisk: 0.05 }
     ]
   })
   ```

2. **acRisk 누락**
   ```typescript
   // ❌ Agent가 이렇게 하면 안 됨
   editTask({
     userStoryId: "US-002",
     acceptanceCriteria: [
       ...기존AC들,
       { description: "새 AC" }  // acRisk 없음!
     ]
   })
   
   // ✅ Agent는 반드시 acRisk 포함
   editTask({
     userStoryId: "US-002",
     acceptanceCriteria: [
       ...기존AC들,
       { description: "새 AC", acRisk: 0.05 }
     ]
   })
   ```
   💡 사용자가 yaml 직접 편집 시에는 생략 가능

3. **uncertRisk 직접 입력**
   ```typescript
   // ❌ 잘못된 예시
   uncertainties: [{
     description: "...",
     uncertRisk: 0.20,  // 이거 안 됨!
     acCandidates: [...]
   }]
   
   // ✅ 올바른 예시
   uncertainties: [{
     description: "...",
     acCandidates: [...]  // uncertRisk는 자동 계산됨
   }]
   ```

4. **acCandidates 누락 (Agent 전용)**
   ```typescript
   // ❌ Agent가 이렇게 하면 안 됨
   uncertainties: [{
     description: "본인 확인 방법 (기술적)"
     // acCandidates 없음!
   }]
   
   // ✅ Agent는 반드시 acCandidates 포함
   uncertainties: [{
     description: "본인 확인 방법 (기술적)",
     acCandidates: [...]  // 필수!
   }]
   ```

5. **의존성 영향 미확인**
   ```
   ❌ US-002 수정 → US-003 확인 안 함
   ✅ US-002 수정 → US-003의 uncertainty 해소 가능한지 확인
   ```

6. **Risk 직접 계산**
   ```typescript
   // ❌ 잘못된 예시
   editTask({
     userStoryId: "US-002",
     risk: 0.56  // 이거 안 됨!
   })
   
   // ✅ 올바른 예시
   editTask({
     userStoryId: "US-002",
     acceptanceCriteria: [...]  // risk는 자동 계산됨
   })
   ```

## 예시: 완전한 수정 플로우

```typescript
// 1. 현재 task 읽기
const tasks = await readTasks()
const task = tasks.find(t => t.userStoryId === "US-002")

// 2. 기존 AC 유지 + 새 AC 추가
const updatedAC = [
  ...task.acceptanceCriteria,
  {
    description: "알바생의 전화번호를 입력받는다",
    acRisk: 0.05
  },
  {
    description: "전화번호 형식 검증을 한다 (010-XXXX-XXXX)",
    acRisk: 0.08
  }
]

// 3. editTask 호출
editTask({
  userStoryId: "US-002",
  acceptanceCriteria: updatedAC
  // uncertainties는 그대로 유지됨
})

// 4. risk 자동 재계산됨
// Before: 0.43 → After: 0.56
```

## 패턴: AC vs Uncertainty 판단

**명확하면 → AC**
```yaml
acceptanceCriteria:
  - description: "알바생의 전화번호를 입력받는다"
    acRisk: 0.05
```

**불확실하면 → Uncertainty**
```yaml
uncertainties:
  - description: "전화번호 수집 목적 (기획적)"
    acCandidates:
      - description: "급여 명세서 발송용으로만 사용"
        acRiskIfSelected: 0.05
      - description: "급여 명세서 + 긴급 연락용"
        acRiskIfSelected: 0.10
```

**판단 기준:**
- 유저가 명시적으로 언급 → AC
- 여러 방법 가능, 선택 필요 → Uncertainty
- 기술적 의사결정 필요 → Uncertainty
- 엣지 케이스 처리 방법 불명확 → Uncertainty

