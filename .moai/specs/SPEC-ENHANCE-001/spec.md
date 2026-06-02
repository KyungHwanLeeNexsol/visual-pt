---
id: SPEC-ENHANCE-001
version: "1.2.0"
status: draft
created: "2026-06-02"
updated: "2026-06-02"
author: "Visual PT Team"
priority: high
issue_number: 0
---

# SPEC-ENHANCE-001: Visual PT — 운동별 각도 정교화 + 세션 분석 + Gemini AI 코칭 통합

## HISTORY
| 버전 | 날짜 | 변경사항 | 작성자 |
|------|------|---------|-------|
| 1.0.0 | 2026-06-02 | 초안 작성 (Feature 1~3 통합 SPEC) | Visual PT Team |
| 1.1.0 | 2026-06-02 | REQ-E3 Gemini 통합을 클라이언트 직접 호출에서 백엔드 프록시(Express.js 서버) 방식으로 변경 | Visual PT Team |
| 1.2.0 | 2026-06-02 | REQ-E3-002 updated: 4-key rotation implementation (`GEMINI_API_KEY_1`~`GEMINI_API_KEY_4`, 429 Rate Limit 자동 키 폴백) | Visual PT Team |

## 개요

본 SPEC은 SPEC-UI-001(실시간 자세 추정 코어)과 SPEC-UI-002(내비게이션 쉘 + 카메라 연결) 위에 구축되는 **3개 기능 묶음 향상(enhancement)** 을 정의한다.

**해결하는 문제:**
현재 자세 추정 파이프라인은 운동 종류(`squat`/`deadlift`)를 인지하지만 실질적으로 사용하지 않는다. `JointAngleCalculator.calculateAngles`와 `FeedbackGenerator.generateMessages`는 `exercise` 인자를 `void exercise`로 폐기하여 두 운동 모두에 동일한 각도 계산과 동일한 한국어 피드백을 적용한다. 또한 세션 중 누적되는 관절 데이터가 전혀 보존되지 않아 세션 종료 시 사용자에게 어떤 요약도 제공하지 못하며, 종료는 단순 `navigation.goBack()` 으로 끝난다. 마지막으로 개인화된 코칭 조언이 없어 사용자가 자신의 수행을 개선할 맥락을 얻지 못한다.

본 SPEC은 다음 세 기능으로 이를 해결한다:
1. **운동별 각도 정교화** — `void exercise` 제거, 운동별 각도 로직·임계값·피드백 메시지 분기
2. **세션 분석 및 요약** — 세션 중 시계열 각도 누적, 반복(rep) 카운트, 종료 시 요약 화면 표시
3. **Gemini API 기반 AI 코칭 (백엔드 프록시)** — 세션 요약 데이터를 전용 백엔드 서버(Express.js)로 전송하고, 서버가 Gemini를 호출하여 개인화된 한국어 코칭 메시지를 생성·반환·표시. React Native 클라이언트는 Gemini API 키를 직접 보유하지 않는다.

**범위 (In-Scope):**
- (E1) `JointAngleCalculator` / `FeedbackGenerator`의 `void exercise` 제거 및 운동별 분기 로직
- (E1) `pose.config.ts` 운동별 임계값 정교화 및 운동별 피드백 메시지 추가
- (E2) `SessionAnalyticsService` — 시계열 각도 누적, rep 카운트, 요약 통계 계산
- (E2) `sessionAnalyticsStore` — 인메모리 분석 상태 관리(Zustand)
- (E2) `SessionSummaryScreen` — 요약·통계·차트 표시, 종료 시 이 화면으로 내비게이트
- (E3) **백엔드 서버** (`server/`) — Express.js + TypeScript, `POST /api/coaching` 단일 엔드포인트, 서버 측 `.env`에 Gemini API 키 보관, Gemini API 호출 후 코칭 메시지 반환
- (E3) `AICoachingService`(구 `GeminiCoachingService`) — React Native 클라이언트가 백엔드 `/api/coaching` 엔드포인트를 호출(Gemini 직접 호출 아님), 한국어 코칭 메시지 수신
- (E3) `mobile/.env` 기반 `API_BASE_URL` 주입 (Gemini 키는 클라이언트에 없음)
- (E3) 서버 미도달/실패 시 규칙 기반 fallback 요약 표시

**범위 외 (Out-of-Scope):** `## Exclusions (What NOT to Build)` 절 참조.

## Glossary (용어 정의)

| 용어 | 정의 |
|------|------|
| rep (반복) | 운동 1회 동작 주기. 스쿼트는 무릎 굽힘(하강)→펴짐(상승) 1주기, 데드리프트는 엉덩이 힌지 굽힘→신전 1주기 |
| 시계열 각도 데이터 | 세션 중 프레임마다 기록되는 `{ timestamp, angles }` 샘플의 순차 목록 |
| 세션 요약 | 총 rep 수, 관절별 평균 각도, 에러 타입별 발생 빈도를 포함하는 집계 결과 |
| AI 코칭 메시지 | 세션 요약을 입력으로 백엔드 서버가 Gemini를 호출하여 생성한 개인화 한국어 조언 텍스트 |
| 백엔드 프록시 | `server/`의 Express.js 서버. 클라이언트와 Gemini API 사이에서 요청을 중계하며 API 키를 서버 측에 보관한다 |
| `/api/coaching` | 백엔드 프록시의 단일 엔드포인트(`POST`). 세션 요약을 받아 코칭 메시지를 반환한다 |
| fallback 요약 | 백엔드 서버 미도달 또는 호출 실패 시 클라이언트가 규칙 기반으로 생성하는 대체 텍스트 요약 |

## Assumptions (가정)

| 가정 | 신뢰도 | 위험 시 영향 |
|------|--------|-------------|
| `frameProcessor`가 향후 실제 랜드마크를 `usePoseDetection`으로 전달하면 본 SPEC 로직이 그대로 동작한다 | 높음 | mock 데이터로는 rep 카운트가 동작하지 않으나, 인터페이스는 동일하므로 코드 변경 불필요 |
| 백엔드 서버가 개발 환경에서 `http://localhost:3001`로 접근 가능하다(실기기/에뮬레이터의 호스트 주소는 `API_BASE_URL`로 설정 가능) | 높음 | 주소 불일치 시 서버 미도달 → fallback 경로로 처리 |
| 서버 측에 Gemini API 키가 `.env`로 주입되어 있다 | 높음 | 키 누락 시 서버가 오류 반환 → 클라이언트 fallback 경로로 처리 |
| `gemini-1.5-flash`가 한국어 프롬프트·응답을 안정적으로 지원한다 | 높음 | 응답 품질 저하 시에도 텍스트는 표시 가능, fallback 불필요 |
| 세션당 시계열 샘플 수가 메모리에 안전하게 적재 가능한 규모이다(수천 건 이내) | 중간 | 장시간 세션 시 메모리 압박 → 샘플링 간격 조정으로 완화 |

---

## Requirements (EARS)

### Feature 1: 운동별 각도 정교화 (REQ-E1)

#### REQ-E1-001 — exercise 인자 활용 (각도 계산)
- **EARS:** WHEN `JointAngleCalculator.calculateAngles(landmarks, exercise)`가 호출되면 THE SYSTEM SHALL `exercise` 값(`squat` 또는 `deadlift`)에 따라 해당 운동에 필요한 관절 각도만 계산하고 `void exercise` 폐기 코드를 제거해야 한다.
- **Acceptance Criteria:** `squat` 호출 시 무릎·엉덩이·척추 각도가 계산되고, `deadlift` 호출 시 척추·엉덩이·무릎 각도가 운동 특성에 맞는 우선순위로 계산된다. 소스에 `void exercise` 문자열이 존재하지 않는다.
- **Priority:** High
- **Dependencies:** 없음

#### REQ-E1-002 — exercise 인자 활용 (피드백 생성)
- **EARS:** WHEN `FeedbackGenerator.generateMessages(errors, exercise)`가 호출되면 THE SYSTEM SHALL `exercise` 값에 따라 운동별 피드백 메시지를 선택하고 `void exercise` 폐기 코드를 제거해야 한다.
- **Acceptance Criteria:** 동일한 `FormError`라도 `squat`과 `deadlift`에서 서로 다른(운동 맥락에 맞는) `text`/`speechText`가 반환된다. 소스에 `void exercise` 문자열이 존재하지 않는다.
- **Priority:** High
- **Dependencies:** REQ-E1-005

#### REQ-E1-003 — 스쿼트 전용 각도 검증 로직
- **EARS:** WHILE 선택된 운동이 `squat`인 동안 THE SYSTEM SHALL 무릎 굽힘 깊이와 척추 중립을 스쿼트 기준 임계값으로 검증하여 폼 오류를 감지해야 한다.
- **Acceptance Criteria:** 스쿼트 무릎 각도가 스쿼트 임계값 범위를 벗어나면 `KNEE_ANGLE_OUT_OF_RANGE` 에러가 생성되고, 데드리프트 임계값과는 독립적으로 동작한다.
- **Priority:** High
- **Dependencies:** REQ-E1-001, REQ-E1-004

#### REQ-E1-004 — 데드리프트 전용 각도 검증 로직
- **EARS:** WHILE 선택된 운동이 `deadlift`인 동안 THE SYSTEM SHALL 엉덩이 힌지 각도와 척추 중립을 데드리프트 기준 임계값으로 검증하여 폼 오류를 감지해야 한다.
- **Acceptance Criteria:** 데드리프트 엉덩이/척추 각도가 데드리프트 임계값을 벗어나면 해당 에러가 생성되고, 스쿼트 임계값과는 독립적으로 동작한다.
- **Priority:** High
- **Dependencies:** REQ-E1-001, REQ-E1-004 자체는 REQ-E1-004 임계값(`pose.config.ts`)에 의존

#### REQ-E1-005 — 운동별 피드백 메시지 정의
- **EARS:** THE SYSTEM SHALL 각 `FormErrorType`에 대해 운동별(`squat` / `deadlift`) 한국어 피드백 메시지를 `feedback.config.ts`에 정의해야 한다.
- **Acceptance Criteria:** `feedback.config.ts`에 운동별 메시지 매핑이 존재하며, 모든 `FormErrorType`과 모든 지원 운동 조합에 대해 빈 문자열이 아닌 한국어 `text`/`speechText`가 정의되어 있다. 운동별 메시지가 없을 경우 기존 공통 메시지로 안전하게 폴백한다.
- **Priority:** High
- **Dependencies:** 없음

#### REQ-E1-006 — 임계값 정교화
- **EARS:** THE SYSTEM SHALL `pose.config.ts`의 `squat`/`deadlift` 관절 각도 임계값을 운동 역학에 맞게 정교화하고 각 임계값의 근거를 한국어 주석으로 명시해야 한다.
- **Acceptance Criteria:** `POSE_CONFIG.squat`/`POSE_CONFIG.deadlift`의 각 임계값에 의미를 설명하는 한국어 주석이 존재하며, 기존 타입(`ExerciseConfig`) 계약을 깨지 않는다.
- **Priority:** Medium
- **Dependencies:** REQ-E1-003, REQ-E1-004

#### REQ-E1-007 — 미지원 운동 방어 (Unwanted Behavior)
- **EARS:** IF `calculateAngles` 또는 `generateMessages`가 정의되지 않은 운동 타입을 수신하면 THEN THE SYSTEM SHALL 예외를 던지지 않고 공통 기본 동작(기존 SPEC-UI-001 동작)으로 안전하게 폴백해야 한다.
- **Acceptance Criteria:** 알 수 없는 운동 타입 입력 시 런타임 에러 없이 빈 결과 또는 공통 동작이 반환된다.
- **Priority:** Medium
- **Dependencies:** REQ-E1-001, REQ-E1-002

---

### Feature 2: 세션 분석 및 요약 (REQ-E2)

#### REQ-E2-001 — 시계열 각도 누적
- **EARS:** WHILE 운동 세션이 활성 상태인 동안 THE SYSTEM SHALL 각 포즈 프레임의 관절 각도를 타임스탬프와 함께 인메모리 시계열로 누적해야 한다.
- **Acceptance Criteria:** `SessionAnalyticsService`가 프레임마다 `{ timestamp, angles }` 샘플을 추가하고, 세션 동안 샘플 수가 단조 증가한다.
- **Priority:** High
- **Dependencies:** REQ-E1-001

#### REQ-E2-002 — 스쿼트 반복 카운트
- **EARS:** WHILE 선택된 운동이 `squat`인 동안 THE SYSTEM SHALL 무릎 각도의 하강(굽힘)→상승(신전) 1주기를 1회 반복으로 카운트해야 한다.
- **Acceptance Criteria:** 무릎 각도가 하강 임계값 아래로 내려갔다가 상승 임계값 위로 복귀하는 완전한 주기마다 rep 카운트가 1 증가한다. 미완료 주기는 카운트되지 않는다.
- **Priority:** High
- **Dependencies:** REQ-E2-001

#### REQ-E2-003 — 데드리프트 반복 카운트
- **EARS:** WHILE 선택된 운동이 `deadlift`인 동안 THE SYSTEM SHALL 엉덩이 힌지 굽힘→신전 1주기를 1회 반복으로 카운트해야 한다.
- **Acceptance Criteria:** 엉덩이 각도가 힌지 임계값 아래로 굽혀졌다가 신전 임계값 위로 복귀하는 완전한 주기마다 rep 카운트가 1 증가한다.
- **Priority:** High
- **Dependencies:** REQ-E2-001

#### REQ-E2-004 — 세션 요약 통계 계산
- **EARS:** WHEN 세션이 종료되면 THE SYSTEM SHALL 총 반복 수, 관절별 평균 각도, 에러 타입별 발생 빈도를 포함하는 세션 요약을 계산해야 한다.
- **Acceptance Criteria:** 요약 객체가 `totalReps`, 관절별 평균 각도 맵, `FormErrorType`별 발생 횟수 맵을 포함하며, 누적 샘플이 0건이면 평균은 정의되지 않음(undefined) 또는 0으로 안전 처리된다.
- **Priority:** High
- **Dependencies:** REQ-E2-001, REQ-E2-002, REQ-E2-003

#### REQ-E2-005 — 분석 상태 인메모리 관리
- **EARS:** THE SYSTEM SHALL 세션 분석 데이터를 `sessionAnalyticsStore`(Zustand)에 인메모리로만 보관하고 앱 재시작 시 데이터를 보존하지 않아야 한다.
- **Acceptance Criteria:** `sessionAnalyticsStore`에 영속화 미들웨어(persist 등)가 적용되지 않으며, 새 세션 시작 시 이전 세션 분석 데이터가 초기화된다.
- **Priority:** High
- **Dependencies:** REQ-E2-001

#### REQ-E2-006 — 요약 화면 표시
- **EARS:** WHEN 세션이 종료되면 THE SYSTEM SHALL 기존 `navigation.goBack()` 대신 `SessionSummaryScreen`으로 내비게이트하여 총 반복 수·관절별 평균·에러 빈도를 통계/차트로 표시해야 한다.
- **Acceptance Criteria:** 세션 종료 버튼을 누르면 `SessionSummaryScreen`이 렌더링되고, 총 reps·평균 각도·에러 빈도가 한국어 라벨로 화면에 표시된다.
- **Priority:** High
- **Dependencies:** REQ-E2-004, REQ-E2-007

#### REQ-E2-007 — 내비게이션 라우트 확장
- **EARS:** THE SYSTEM SHALL `RootStackParamList`에 `SessionSummary` 라우트(세션 요약 데이터를 파라미터로 수신)를 추가하고 `RootNavigator`에 등록해야 한다.
- **Acceptance Criteria:** `navigation/types.ts`에 `SessionSummary` 라우트 타입과 props 헬퍼가 추가되고, `RootNavigator.tsx`에 해당 화면이 스택에 등록되어 타입 안전하게 내비게이트된다.
- **Priority:** High
- **Dependencies:** 없음

#### REQ-E2-008 — 빈/부족 데이터 방어 (Unwanted Behavior)
- **EARS:** IF 세션 종료 시 누적된 시계열 샘플이 없거나 rep이 0이면 THEN THE SYSTEM SHALL 충돌 없이 "데이터 부족" 상태의 요약 화면을 한국어로 표시해야 한다.
- **Acceptance Criteria:** 샘플 0건 세션 종료 시에도 `SessionSummaryScreen`이 정상 렌더링되며, "기록된 동작이 없습니다" 류의 안내 텍스트가 표시된다.
- **Priority:** Medium
- **Dependencies:** REQ-E2-004, REQ-E2-006

---

### Feature 3: Gemini API 기반 AI 코칭 (백엔드 프록시) (REQ-E3)

#### REQ-E3-001 — AI 코칭 요청 생성 (백엔드 호출)
- **EARS:** WHEN 세션 요약이 계산되면 THE SYSTEM SHALL 운동 종류·총 반복 수·관절별 평균 각도·에러 패턴을 포함하는 요청 본문을 구성하여 백엔드 `${API_BASE_URL}/api/coaching` 엔드포인트에 한국어 코칭 조언을 요청해야 한다.
- **Acceptance Criteria:** `AICoachingService`가 세션 요약을 입력받아 백엔드 `/api/coaching`에 `POST` 요청을 보내고, 요청 본문에 운동 종류·reps·평균 각도·에러 패턴이 포함된다. React Native 측 코드 어디에도 Gemini API 키나 `@google/generative-ai` 직접 호출이 존재하지 않는다.
- **Priority:** High
- **Dependencies:** REQ-E2-004, REQ-E3-002

#### REQ-E3-002 — API 키 서버 측 다중 보관(키 로테이션) 및 클라이언트 키 미보유
- **EARS:** THE SYSTEM SHALL Gemini API 키를 백엔드 서버(`server/.env`)에만 보관하고, 최대 4개의 키(`GEMINI_API_KEY_1`~`GEMINI_API_KEY_4`)를 등록할 수 있어야 하며, React Native 앱은 Gemini API 키를 저장하거나 직접 사용하지 않아야 한다.
- **EARS:** WHERE 번호가 매겨진 키(`GEMINI_API_KEY_1`~`GEMINI_API_KEY_4`)가 하나도 존재하지 않는 경우 THE SYSTEM SHALL 단일 키 `GEMINI_API_KEY`를 폴백으로 사용해야 한다.
- **EARS:** WHEN Gemini 호출이 429 Rate Limit 응답을 반환하면 THE SYSTEM SHALL 다음 사용 가능한 키로 자동 전환하여 재시도해야 한다.
- **EARS:** IF 등록된 모든 키가 429 Rate Limit으로 소진되면 THEN THE SYSTEM SHALL 예외를 던지지 않고 오류 응답을 반환하여 클라이언트가 fallback 경로(REQ-E3-005)로 처리하도록 해야 한다.
- **Acceptance Criteria:**
  - `server/.env`(템플릿: `GEMINI_API_KEY_1=your-key-here` ... `GEMINI_API_KEY_4=your-key-here`)에 최대 4개의 키 항목을 등록할 수 있고, 서버가 등록된 키들로 Gemini를 호출한다.
  - 번호가 매겨진 키가 하나도 없으면 서버는 단일 키 `GEMINI_API_KEY`를 사용한다(단일 키 폴백).
  - Gemini 호출이 429 Rate Limit을 반환하면 다음 사용 가능한 키로 전환되어 재시도가 발생한다(429 → 키 로테이션 트리거를 테스트로 검증).
  - 모든 키가 429로 소진되면 서버가 충돌 없이 오류 응답을 반환하고, 클라이언트는 fallback 요약을 표시한다.
  - `mobile/.env`에는 `API_BASE_URL=http://localhost:3001`만 존재하며 Gemini 키가 없다. React Native 소스 어디에도 Gemini 키 리터럴이나 직접 호출이 존재하지 않는다.
  - `.env` 파일들은 `.gitignore` 대상이거나 플레이스홀더만 포함한다.
- **Priority:** High
- **Dependencies:** 없음

#### REQ-E3-003 — 서버 측 Gemini 호출 및 요청 검증
- **EARS:** WHEN 백엔드가 `POST /api/coaching` 요청을 수신하면 THE SYSTEM SHALL 요청 본문을 검증한 뒤 `gemini-1.5-flash` 모델을 호출하여 한국어 코칭 메시지를 생성하고 응답으로 반환해야 한다.
- **Acceptance Criteria:** `server/src/routes/coaching.ts`가 요청 본문(운동 종류·reps·평균 각도·에러 패턴)을 검증하고, 유효하지 않으면 4xx 오류를 반환한다. 유효한 요청은 `server/src/services/GeminiService.ts`를 통해 Gemini를 호출하여 코칭 메시지를 JSON으로 반환한다.
- **Priority:** High
- **Dependencies:** REQ-E3-001, REQ-E3-002

#### REQ-E3-004 — 코칭 메시지 표시
- **EARS:** WHEN 백엔드가 코칭 응답을 반환하면 THE SYSTEM SHALL 해당 한국어 코칭 메시지를 `SessionSummaryScreen`에 표시해야 한다.
- **Acceptance Criteria:** 코칭 응답 수신 후 요약 화면의 코칭 영역에 응답 텍스트가 한국어로 렌더링되고, 응답 대기 중에는 로딩 상태가 표시된다.
- **Priority:** High
- **Dependencies:** REQ-E3-001, REQ-E2-006

#### REQ-E3-005 — 서버 미도달/실패 시 fallback (Unwanted Behavior)
- **EARS:** IF 백엔드 호출이 실패(서버 미도달, 네트워크 오류, 서버 측 키 누락, 응답 오류)하면 THEN THE SYSTEM SHALL 충돌 없이 규칙 기반 요약 메시지를 한국어로 대신 표시해야 한다.
- **Acceptance Criteria:** 서버가 도달 불가하거나 호출이 예외/오류 응답을 반환하면 앱이 멈추지 않고, 세션 요약 통계 기반의 규칙 기반 한국어 메시지가 코칭 영역에 표시된다.
- **Priority:** High
- **Dependencies:** REQ-E3-001, REQ-E2-004

#### REQ-E3-006 — AI 코칭 선택성 (Optional)
- **EARS:** WHERE AI 코칭이 사용 가능한 경우 THE SYSTEM SHALL AI 코칭 메시지를 우선 표시하고, 그렇지 않은 경우 fallback 요약만으로도 요약 화면이 완전하게 동작하도록 해야 한다.
- **Acceptance Criteria:** AI 코칭 없이도 `SessionSummaryScreen`의 핵심 통계 표시가 모두 정상 동작하며, AI 코칭은 부가 정보로만 위치한다.
- **Priority:** Medium
- **Dependencies:** REQ-E3-004, REQ-E3-005

#### REQ-E3-007 — 코칭 호출 비차단 (Non-blocking)
- **EARS:** WHILE 백엔드 응답을 대기하는 동안 THE SYSTEM SHALL 세션 요약 통계 표시를 차단하지 않고 비동기로 코칭 결과를 갱신해야 한다.
- **Acceptance Criteria:** 요약 화면 진입 즉시 통계가 표시되고, 코칭 메시지는 응답 도착 시 별도로 채워진다(통계 렌더링이 백엔드 호출을 기다리지 않는다).
- **Priority:** Medium
- **Dependencies:** REQ-E3-001, REQ-E3-004

---

## Non-Functional Constraints (비기능 제약)

- **언어:** 모든 UI 텍스트는 한국어, 모든 코드 주석은 한국어(`language.yaml: code_comments: ko`).
- **보안:** Gemini API 키는 백엔드 서버(`server/.env`)에만 보관하고 React Native 클라이언트에는 두지 않는다. 클라이언트는 백엔드 프록시(`/api/coaching`)만 호출한다. 어떤 소스에도 키를 하드코딩하지 않는다.
- **데이터 수명:** 세션 분석 데이터는 인메모리 전용, 앱 재시작 시 비영속.
- **안정성:** AI 코칭 호출은 선택적이며 실패 시 fallback으로 graceful degradation.
- **호환성:** 기존 SPEC-UI-001/002 타입 계약(`JointAngles`, `ExerciseType`, `FormError`, `RootStackParamList`)을 깨지 않고 확장만 허용.
- **mock frameProcessor 불변:** `CameraScreen.tsx`의 mock `frameProcessor`(TODO)는 수정하지 않음.

---

## Exclusions (What NOT to Build)

다음 항목은 본 SPEC 범위에서 **명시적으로 제외**한다:

- **실기기 MediaPipe 통합:** `CameraScreen.tsx`의 mock `frameProcessor`(line 127-139 TODO)를 실제 `react-native-mediapipe-posedetection` 네이티브 플러그인에 연결하는 작업은 별도 하드웨어 통합 SPEC에서 다룬다. 본 SPEC은 mock을 수정하지 않는다.
- **사용자 인증:** 로그인·회원가입·계정 관리는 다루지 않는다.
- **데이터 영속화 / 백엔드:** 세션 데이터의 디스크 저장·클라우드 동기화·서버 업로드는 다루지 않는다(인메모리 전용).
- **다중 사용자 프로필:** 여러 사용자 프로필 관리는 다루지 않는다.
- **신규 운동 종목 추가:** 스쿼트·데드리프트 외 운동(예: 벤치프레스, 오버헤드프레스)은 추가하지 않는다.
- **AI 코칭 대화형 인터페이스:** Gemini와의 다중 턴 대화·RAG 챗봇은 다루지 않는다(단일 요청·단일 응답만).
- **세션 녹화·재생:** 카메라 영상 녹화·저장·재생 기능은 다루지 않는다.
- **음성 코칭 합성(TTS):** AI 코칭 메시지의 음성 출력은 다루지 않는다(텍스트 표시만).

---

## Traceability (요구사항 ↔ 파일 매핑)

| REQ | 주요 대상 파일 |
|-----|---------------|
| REQ-E1-001, E1-003, E1-004, E1-007 | `mobile/src/services/JointAngleCalculator.ts` |
| REQ-E1-002, E1-005 | `mobile/src/services/FeedbackGenerator.ts`, `mobile/src/config/feedback.config.ts` |
| REQ-E1-006 | `mobile/src/config/pose.config.ts` |
| REQ-E2-001~004 | `mobile/src/services/SessionAnalyticsService.ts` |
| REQ-E2-005 | `mobile/src/store/sessionAnalyticsStore.ts` |
| REQ-E2-006, E2-008 | `mobile/src/screens/SessionSummaryScreen.tsx`, `mobile/src/screens/CameraScreen.tsx` |
| REQ-E2-007 | `mobile/src/navigation/types.ts`, `mobile/src/navigation/RootNavigator.tsx` |
| REQ-E3-001, E3-007 | `mobile/src/services/AICoachingService.ts` |
| REQ-E3-002 | `server/.env`, `mobile/.env`, `mobile/src/types/env.d.ts` |
| REQ-E3-003 | `server/src/index.ts`, `server/src/routes/coaching.ts`, `server/src/services/GeminiService.ts`, `server/package.json`, `server/tsconfig.json` |
| REQ-E3-004, E3-005, E3-006 | `mobile/src/screens/SessionSummaryScreen.tsx` |
