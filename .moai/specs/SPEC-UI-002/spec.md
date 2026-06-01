---
id: SPEC-UI-002
version: "1.0.0"
status: draft
created: "2026-06-01"
updated: "2026-06-01"
author: "Visual PT Team"
priority: high
issue_number: 0
---

# SPEC-UI-002: 앱 내비게이션 쉘 및 카메라 실제 연결

## HISTORY
| 버전 | 날짜 | 변경사항 | 작성자 |
|------|------|---------|-------|
| 1.0.0 | 2026-06-01 | 초안 작성 | Visual PT Team |

## 개요

본 SPEC은 SPEC-UI-001에서 구현한 실시간 자세 추정 코어(`CameraScreen.tsx` 및 서비스·훅·스토어·컴포넌트)를 **실제로 실행 가능한 앱으로 묶는 내비게이션 쉘**과 **카메라 실기기 연결**을 정의한다.

**해결하는 문제:**
현재 앱에는 진입점(`App.tsx`/`index`), 내비게이션, 홈 화면이 전혀 없다. SPEC-UI-001로 코어 파이프라인은 완성되었으나 APK를 설치해도 앱이 실행되지 않는다. 또한 `CameraScreen`의 카메라 영역은 `"카메라 대기 중"` 플레이스홀더(`<View>`)로 남아 있어 실제 카메라 프레임이 추론 파이프라인에 연결되지 않는다. 본 SPEC은 앱 진입 → 홈 → 운동 선택 → 카메라 흐름을 구성하고, `react-native-vision-camera`의 실제 `<Camera>` 컴포넌트와 프레임 프로세서를 포즈 추론 훅에 연결하여 **설치 즉시 동작하는 MVP 앱**을 완성한다.

**범위 (In-Scope):**
- 앱 진입점 `App.tsx` + react-navigation 네이티브 스택 네비게이터 셋업 (N1)
- `Home → WorkoutSelection → Camera` 스택 화면 흐름 (N1)
- `HomeScreen`: 앱 타이틀·태그라인, "운동 시작" 버튼, MVP 운동 목록, 법적 면책 고지 (N2)
- `WorkoutSelectionScreen`: 스쿼트/데드리프트 운동 카드, "시작" 버튼, 선택 운동을 네비게이션 파라미터로 전달 (N3)
- `CameraScreen` 내비게이션 통합: 운동 종목을 라우트 파라미터로 수신, 뒤로 가기, 마운트 시 자동 `startSession()` (N4)
- `CameraScreen` 실제 카메라 연결: 플레이스홀더를 `<Camera>` 컴포넌트로 교체, 프레임 프로세서 → `usePoseDetection` 연결, 라이브 피드 위 실시간 스켈레톤 오버레이 (N5)
- MVP 대상 운동: 스쿼트, 데드리프트

**범위 외 (Out-of-Scope):**
- 운동 세션 녹화·저장·재생 및 분석 보고서 (별도 **SPEC-UI-DB-002**에서 다룸)
- RAG 챗봇 / 운동 코칭 대화형 인터페이스
- 백엔드 업로드 및 클라우드 동기화
- 사용자 계정·인증·온보딩
- 운동 종목 추가 (스쿼트/데드리프트 외)
- 딥링크 외부 진입(URL Scheme) 정식 지원 — N1에서 선택(Optional) 항목으로만 다룸
- 포즈 추정·각도 분석·피드백 알고리즘 자체 (SPEC-UI-001에서 완료, 본 SPEC은 통합·연결만 담당)

---

## 요구사항

### N1. 앱 진입점 및 내비게이션 쉘 (App Entry Point & Navigation Shell)

- **Ubiquitous:** 시스템은 **항상** `App.tsx` 루트 컴포넌트에서 `NavigationContainer`로 감싼 네이티브 스택 네비게이터를 통해 화면을 렌더링해야 한다.
- **Event-Driven:** **WHEN** 앱이 콜드 스타트로 실행되면 **THEN** 시스템은 초기 라우트로 `HomeScreen`을 표시해야 한다.
- **Ubiquitous:** 시스템은 **항상** `Home`, `WorkoutSelection`, `Camera` 3개 화면을 타입 안전한 스택 파라미터 목록(`RootStackParamList`)으로 등록해야 한다.
- **Unwanted:** **IF** 등록되지 않은 라우트 이름이나 필수 파라미터 누락으로 네비게이션이 시도되면 **THEN** 시스템은 런타임 크래시 없이 처리해야 하며, 타입 단계에서 컴파일 오류로 차단되도록 타입을 정의해야 **한다**.
- **Optional:** **가능하면** 시스템은 운동 시작용 딥링크(예: `visualpt://workout/squat`)를 통한 직접 진입을 제공한다.

### N2. 홈 화면 (HomeScreen)

- **Ubiquitous:** 시스템은 **항상** 홈 화면에 앱 타이틀("Visual PT")과 태그라인을 표시해야 한다.
- **Event-Driven:** **WHEN** 사용자가 "운동 시작" 버튼을 누르면 **THEN** 시스템은 `WorkoutSelection` 화면으로 이동해야 한다.
- **Ubiquitous:** 시스템은 **항상** 홈 화면에 MVP 운동 목록(스쿼트, 데드리프트)을 표시해야 한다.
- **Ubiquitous:** 시스템은 **항상** 홈 화면에 법적 면책 고지("의료·재활 진단 도구가 아님", "2D 카메라 분석 한계")를 표시해야 한다.

### N3. 운동 선택 화면 (WorkoutSelectionScreen)

- **Ubiquitous:** 시스템은 **항상** 운동 선택 화면에 사용 가능한 운동(스쿼트, 데드리프트) 목록을 표시해야 한다.
- **Ubiquitous:** 시스템은 **항상** 각 운동을 설명 텍스트와 이미지 플레이스홀더를 포함한 카드 형태로 표시해야 한다.
- **Event-Driven:** **WHEN** 사용자가 특정 운동 카드의 "시작" 버튼을 누르면 **THEN** 시스템은 선택된 운동 종목(`ExerciseType`)을 라우트 파라미터로 담아 `Camera` 화면으로 이동해야 한다.
- **Unwanted:** **IF** 유효하지 않은 운동 종목으로 `Camera` 화면 이동이 시도되면 **THEN** 시스템은 해당 종목을 카메라 화면으로 전달하지 **않아야 한다**.

### N4. 카메라 화면 내비게이션 통합 (CameraScreen Navigation Integration)

- **Ubiquitous:** 시스템은 **항상** `CameraScreen`에서 운동 종목을 수동 스토어 선택이 아닌 **라우트 파라미터**(`route.params.exercise`)로부터 수신해야 한다.
- **Event-Driven:** **WHEN** `CameraScreen`이 마운트되면 **THEN** 시스템은 라우트 파라미터의 운동 종목으로 `startSession()`을 자동 호출하여 세션을 시작해야 한다.
- **Event-Driven:** **WHEN** 사용자가 뒤로 가기를 수행하면 **THEN** 시스템은 활성 세션을 종료(`endSession()`, `stopDetection()`)하고 `WorkoutSelection` 화면으로 복귀해야 한다.
- **Unwanted:** **IF** 라우트 파라미터에 운동 종목이 없는 상태로 `CameraScreen`에 진입하면 **THEN** 시스템은 추론 세션을 시작하지 **않아야 하며**, 안전하게 이전 화면으로 복귀하거나 안내를 표시해야 한다.

### N5. 카메라 화면 실제 카메라 연결 (Real Camera Integration)

- **Ubiquitous:** 시스템은 **항상** `CameraScreen`의 카메라 영역에 플레이스홀더 `<View>` 대신 `react-native-vision-camera`의 실제 `<Camera>` 컴포넌트로 라이브 카메라 피드를 렌더링해야 한다.
- **State-Driven:** **WHILE** 카메라 권한이 허용되고 활성 디바이스가 존재하는 동안 시스템은 프레임 프로세서를 통해 카메라 프레임을 `usePoseDetection` 추론 파이프라인으로 전달해야 한다.
- **State-Driven:** **WHILE** 세션이 진행 중인 동안 시스템은 라이브 카메라 피드 위에 실시간 포즈 스켈레톤 오버레이를 렌더링해야 한다.
- **Unwanted:** **IF** 카메라 권한이 거부되거나 사용 가능한 카메라 디바이스가 없으면 **THEN** 시스템은 크래시 없이 권한 요청 화면 또는 안내 화면을 표시해야 하며, 추론 루프를 시작하지 **않아야 한다**.

---

## 비기능 요구사항

### 성능 (Performance)
- 화면 전환(Home → WorkoutSelection → Camera) 지연: 사용자 체감 즉각성 유지 (애니메이션 외 블로킹 없음)
- 카메라 마운트 후 첫 프레임 표시 지연: 합리적 범위 내(콜드 마운트)
- 실제 카메라 연결 후에도 SPEC-UI-001 성능 게이트 유지: 최소 30 FPS, 프레임당 추론 <100ms, 피드백 응답 <500ms
- 화면 언마운트 시 카메라·추론 리소스 누수 없이 정리

### 신뢰성 (Reliability)
- 카메라 권한 거부 / 디바이스 미존재 시 graceful fallback (N5 Unwanted)
- 라우트 파라미터 누락 시 안전 복귀 (N4 Unwanted)
- 화면 간 이동·뒤로 가기 반복 시 세션·카메라 상태 일관성 유지 (중복 세션 시작 방지)
- New Architecture(Fabric/TurboModules) 환경에서 react-navigation 및 vision-camera 정상 동작

### 보안·개인정보 (Security & Privacy)
- SPEC-UI-001 원칙 유지: 모든 ML 추론은 온디바이스, 영상·키포인트 외부 미전송
- 본 SPEC 범위에서 영상 저장·업로드는 발생하지 않음 (녹화는 SPEC-UI-DB-002)

### 법적·면책 (Legal)
- 홈 화면 및 카메라 화면에 의료·재활 진단 도구가 아님을 명시 (product.md 면책 문구 준수)
- 2D 카메라 기반 분석의 각도 오차 한계 고지 유지

### 접근성·UX (Accessibility & UX)
- 주요 버튼(운동 시작, 시작, 세션 종료, 뒤로 가기)에 명확한 레이블 및 `testID` 부여
- 다크 테마(`userInterfaceStyle: dark`) 일관성 유지
- 안전 영역(SafeArea) 처리로 노치·홈 인디케이터 침범 방지

---

## 의존성

| 영역 | 라이브러리 | 권장 버전 | 역할 |
|------|-----------|----------|------|
| 프레임워크 | react-native | 0.74.5 (New Architecture) | 코어 모바일 프레임워크 (기존) |
| 언어 | typescript | 5.3+ | 타입 안전성 (기존) |
| 내비게이션 | @react-navigation/native | 8.x | 내비게이션 컨테이너·코어 (**신규**) |
| 내비게이션 | @react-navigation/native-stack | 8.x | 네이티브 스택 네비게이터 (**신규**) |
| 내비게이션 의존 | react-native-screens | 4.x | 네이티브 스크린 최적화 (**신규**) |
| 내비게이션 의존 | react-native-safe-area-context | 4.x | 안전 영역 처리 (**신규**) |
| 카메라 | react-native-vision-camera | 4.5+ | 실제 카메라 스트림 + 프레임 프로세서 (기존, 본 SPEC에서 실연결) |
| 워크릿 | react-native-worklets-core | 1.3+ | 프레임 프로세서 워크릿 실행 (기존) |
| 오버레이 | react-native-svg | 15.6+ | 라이브 피드 위 스켈레톤 렌더링 (기존) |
| 애니메이션 | react-native-reanimated | 3.15+ | UI 스레드 오버레이 갱신 (기존) |
| 상태 관리 | zustand | 4.5+ | workoutStore / feedbackStore (기존) |
| 포즈 추정 | react-native-mediapipe-posedetection | 0.4.x | 온디바이스 추론 (기존) |

> ⚠️ **신규 의존성 추가:** react-navigation 8.x 및 그 필수 동반 패키지(`react-native-screens`, `react-native-safe-area-context`)는 본 SPEC에서 처음 추가된다. New Architecture(Fabric) 호환 버전을 선택해야 하며, 정확한 버전 고정은 `/moai:2-run` 단계에서 확정한다.

> ⚠️ **Expo bare workflow 전제:** SPEC-UI-001에서 vision-camera 도입으로 이미 prebuild(bare workflow)가 필수가 되었다. 본 SPEC의 신규 네이티브 의존성도 prebuild 재실행이 필요하다.

**선행 SPEC 의존:**
- 본 SPEC은 **SPEC-UI-001(완료)** 에 직접 의존한다. `CameraScreen`, `usePoseDetection`, `useCamera`, `workoutStore`, `CameraOverlay` 등 기존 산출물을 재사용·통합한다.

**후속 의존 관계:**
- **SPEC-UI-DB-002**(세션 녹화/분석)는 본 SPEC의 실행 가능한 내비게이션 흐름과 실연결된 카메라 위에서 동작한다.

---

## 기존 자산 재사용 매핑

| 본 SPEC 요구사항 | 재사용/수정 대상 (SPEC-UI-001 산출물) | 작업 유형 |
|------------------|--------------------------------------|----------|
| N1 | (없음 — 신규 `App.tsx`, `src/navigation/`) | 신규 |
| N2 | (없음 — 신규 `src/screens/HomeScreen.tsx`) | 신규 |
| N3 | `workoutStore.selectExercise`, `pose.config`(운동 메타) | 신규 화면 + 기존 참조 |
| N4 | `src/screens/CameraScreen.tsx`, `workoutStore`(startSession/endSession) | 수정 |
| N5 | `CameraScreen.tsx`(플레이스홀더 교체), `usePoseDetection`, `useCamera`, `CameraOverlay` | 수정 |
