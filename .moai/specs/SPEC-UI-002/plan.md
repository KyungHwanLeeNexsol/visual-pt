# SPEC-UI-002 구현 계획 — 앱 내비게이션 쉘 및 카메라 실제 연결

> Status: Planned | Priority: High | Mode: Personal
> Created: 2026-06-01
> Lifecycle: spec-anchored (앱 진입·내비게이션 골격, 구현과 함께 유지)

---

## 1. 추천 SPEC ID 및 근거

### 추천: `SPEC-UI-002` — 앱 내비게이션 쉘 및 카메라 실제 연결

**도메인 선택 근거 (UI):**
본 SPEC의 본질은 앱 진입점·화면 전환·운동 선택 UI·카메라 화면 통합 등 전적으로 사용자 대면 화면 계층이다. 내비게이션 쉘, 홈/운동 선택 화면, 카메라 화면의 라우팅·렌더링 통합이 핵심이므로 SPEC-UI-001과 동일하게 `UI` 도메인이 가장 적합하다.

**왜 `002`인가:**
- SPEC-UI-001(코어 파이프라인)에 이어지는 **두 번째 UI SPEC**이다.
- `SPEC-UI-DB-002`(세션 녹화/분석)는 데이터베이스 관심사를 가진 별도 라인이므로, 본 내비게이션 SPEC은 순수 `UI` 도메인의 `002` 번호를 사용한다.
- ID에 하이픈 2개(`UI-002`)로 단순 유지 — 복합 도메인 명명 회피.

**왜 N1~N5를 단일 SPEC으로 묶는가:**
- N1~N5는 모두 **"설치 즉시 실행되는 MVP 앱"** 이라는 하나의 목표를 위한 상호 의존 단계이다. 진입점(N1) 없이는 어떤 화면도 렌더링되지 않고, 홈(N2)·운동 선택(N3) 없이는 카메라 화면에 도달할 경로가 없으며, 라우트 파라미터 통합(N4) 없이는 실제 카메라 연결(N5)이 의미 있는 운동 컨텍스트를 갖지 못한다.
- 다섯 기능 모두 동일한 내비게이션 그래프와 화면 계층을 공유한다. 분리하면 라우트 파라미터 계약·세션 시작 타이밍의 통합 검증이 불가능해진다.

**왜 녹화·챗봇은 분리하는가:**
- 세션 녹화/저장/분석(SPEC-UI-DB-002)과 RAG 챗봇은 영속성·AI 대화 관심사로, 실행 가능한 앱 쉘과 결합도가 낮고 독립 개발 가능하다.

---

## 2. SPEC 후보 요약

| SPEC ID | 제목 | 범위 | 복잡도 | 우선순위 |
|---------|------|------|--------|---------|
| **SPEC-UI-002** (본 SPEC) | 앱 내비게이션 쉘 및 카메라 실제 연결 | 진입점 + 내비게이션 + 홈 + 운동 선택 + 카메라 통합·실연결 (N1~N5) | L | High |
| SPEC-UI-DB-002 (후속) | 운동 세션 녹화 및 분석 저장 | 세션 녹화 + 저장 + 재생 + 분석 보고서 | L | Medium |

**대안으로 검토했으나 채택하지 않은 분할:**
- 내비게이션(N1~N4)과 카메라 실연결(N5) 2-SPEC 분할: N5는 N4의 라우트 파라미터 기반 세션 시작에 직접 의존하고, "실행 가능한 앱"이라는 단일 산출물을 분절시키므로 기각.
- 화면별 분할(Home / WorkoutSelection / Camera 각각): 내비게이션 그래프와 파라미터 계약이 화면 간에 공유되어 인위적 분리 시 통합 검증 불가, 기각.

> **권장 구현 순서:** SPEC-UI-002 (실행 가능한 앱 쉘) → SPEC-UI-DB-002 (녹화/분석). DB-002는 본 SPEC의 실연결된 카메라 흐름에 의존한다.

---

## 3. EARS 요구사항 구조 설계 (SPEC-UI-002, 5개 모듈)

### N1. 앱 진입점 및 내비게이션 쉘
- **Ubiquitous:** `App.tsx`에서 `NavigationContainer` + 네이티브 스택으로 렌더링.
- **Event-Driven:** **WHEN** 콜드 스타트 **THEN** 초기 라우트 = `HomeScreen`.
- **Ubiquitous:** `Home`/`WorkoutSelection`/`Camera` 3화면을 타입 안전 `RootStackParamList`로 등록.
- **Unwanted:** 미등록 라우트·필수 파라미터 누락은 타입 단계에서 차단.
- **Optional:** **가능하면** 운동 시작 딥링크 제공.

### N2. 홈 화면 (HomeScreen)
- **Ubiquitous:** 타이틀·태그라인 표시.
- **Event-Driven:** **WHEN** "운동 시작" 클릭 **THEN** `WorkoutSelection` 이동.
- **Ubiquitous:** MVP 운동 목록(스쿼트, 데드리프트) 표시.
- **Ubiquitous:** 법적 면책 고지 표시.

### N3. 운동 선택 화면 (WorkoutSelectionScreen)
- **Ubiquitous:** 운동 목록(스쿼트, 데드리프트) 표시.
- **Ubiquitous:** 설명·이미지 플레이스홀더 카드 표시.
- **Event-Driven:** **WHEN** 카드 "시작" 클릭 **THEN** 선택 종목을 라우트 파라미터로 `Camera` 이동.
- **Unwanted:** 유효하지 않은 종목은 카메라로 전달하지 않음.

### N4. 카메라 화면 내비게이션 통합
- **Ubiquitous:** 운동 종목을 `route.params.exercise`로 수신(수동 스토어 선택 대체).
- **Event-Driven:** **WHEN** 마운트 **THEN** 라우트 종목으로 `startSession()` 자동 호출.
- **Event-Driven:** **WHEN** 뒤로 가기 **THEN** 세션 종료 후 `WorkoutSelection` 복귀.
- **Unwanted:** 종목 파라미터 부재 시 세션 미시작 + 안전 복귀.

### N5. 카메라 화면 실제 카메라 연결
- **Ubiquitous:** 플레이스홀더 대신 실제 `<Camera>` 렌더링.
- **State-Driven:** **WHILE** 권한 허용 + 디바이스 존재 동안 프레임 프로세서 → `usePoseDetection` 전달.
- **State-Driven:** **WHILE** 세션 진행 중 라이브 피드 위 스켈레톤 오버레이 렌더링.
- **Unwanted:** 권한 거부·디바이스 부재 시 graceful fallback, 추론 미시작.

---

## 4. 기술 스택 결정 (버전 명시)

> 아래 버전은 SPEC 단계 권장값이며, 프로덕션 안정 버전만 포함한다. 정확한 버전 고정은 `/moai:2-run` 단계에서 최종 확정한다.

| 영역 | 라이브러리 | 권장 버전 | 역할 |
|------|-----------|----------|------|
| 내비게이션 코어 | @react-navigation/native | 8.x | NavigationContainer, 네비게이션 훅 (`useNavigation`, `useRoute`) |
| 스택 | @react-navigation/native-stack | 8.x | 네이티브 성능 스택 (iOS UINavigationController / Android Fragment) |
| 스크린 최적화 | react-native-screens | 4.x | 네이티브 스크린 컨테이너, New Arch 호환 |
| 안전 영역 | react-native-safe-area-context | 4.x | SafeAreaProvider, 노치·인디케이터 처리 |
| 카메라 | react-native-vision-camera | 4.5+ | `<Camera>` + `useCameraDevice` + `useFrameProcessor` |
| 워크릿 | react-native-worklets-core | 1.3+ | 프레임 프로세서 워크릿 런타임 |
| 오버레이 | react-native-svg | 15.6+ | 라이브 피드 위 33관절 스켈레톤 |
| 애니메이션 | react-native-reanimated | 3.15+ | UI 스레드 오버레이 갱신 |
| 상태 관리 | zustand | 4.5+ | workoutStore / feedbackStore |

**아키텍처 패턴 (내비게이션 + 카메라 통합):**
- **타입 안전 라우팅:** `src/navigation/types.ts`에 `RootStackParamList` 정의 (`Camera: { exercise: ExerciseType }`). 화면은 `NativeStackScreenProps<RootStackParamList, 'Camera'>`로 `route.params` 타입 보장.
- **네비게이터 분리:** `src/navigation/RootNavigator.tsx`로 스택 정의를 캡슐화하고 `App.tsx`는 `NavigationContainer` + `SafeAreaProvider`만 책임.
- **파라미터 기반 세션 시작:** N4에서 `CameraScreen`이 마운트 시 `route.params.exercise`를 읽어 `selectExercise()` + `startSession()` + `startDetection()`를 자동 수행. 기존 수동 "운동 선택 후 시작" 버튼 분기 제거.
- **프레임 프로세서 워크릿:** vision-camera `useFrameProcessor`로 프레임을 워크릿에서 캡처 → 네이티브 포즈 추론 플러그인 호출 → `runOnJS` 또는 shared value로 `usePoseDetection`에 결과 전달.
- **언마운트 정리:** `CameraScreen` 언마운트/뒤로 가기 시 `stopDetection()` + `endSession()`로 카메라·추론 리소스 정리 (누수·중복 세션 방지).
- **운동 메타 외부화:** 운동 카드 표시 데이터(이름·설명·이미지 키)를 설정 파일(예: `src/config/exercise.catalog.ts`)로 분리하여 운동 추가 시 확장 용이.

**제약 (SPEC-UI-001 게이트 유지):**
- 실제 카메라 연결 후에도 최소 30 FPS, 프레임당 추론 <100ms, 피드백 응답 <500ms 유지.
- 화면 전환·언마운트 시 리소스 누수 0.

---

## 5. 구현 태스크 분해 (순서 기반)

> 시간 추정 없이 우선순위·의존성 기반으로 정렬.

**1차 목표 (Primary — 실행 가능한 쉘):**
1. 신규 의존성 설치 + prebuild 재실행 (react-navigation 8.x, react-native-screens, react-native-safe-area-context)
2. `src/navigation/types.ts` — `RootStackParamList` 타입 정의 (Home, WorkoutSelection, Camera)
3. `src/navigation/RootNavigator.tsx` — 네이티브 스택 네비게이터 (초기 라우트 Home)
4. `App.tsx` + `index` 진입점 — `SafeAreaProvider` + `NavigationContainer` + `RootNavigator` (N1)

**2차 목표 (Secondary — 진입 화면):**
5. `src/screens/HomeScreen.tsx` — 타이틀·태그라인, "운동 시작" 버튼, 운동 목록, 면책 고지 (N2)
6. `src/config/exercise.catalog.ts` — 운동 메타데이터(스쿼트/데드리프트 설명·이미지 키)
7. `src/screens/WorkoutSelectionScreen.tsx` — 운동 카드, "시작" 버튼, 라우트 파라미터 전달 (N3)

**3차 목표 (Tertiary — 카메라 통합):**
8. `CameraScreen` 수정 — `route.params.exercise` 수신, 마운트 시 자동 `startSession()`, 뒤로 가기 정리 (N4)
9. 파라미터 부재 안전 처리 + 뒤로 가기 시 세션·추론 정리 로직 (N4 Unwanted)

**최종 목표 (Final — 실기기 카메라):**
10. `CameraScreen` 플레이스홀더(`<View>카메라 대기 중</View>`)를 실제 `<Camera>` + `useCameraDevice`로 교체 (N5)
11. `useFrameProcessor` → `usePoseDetection` 연결, 라이브 피드 위 `CameraOverlay` 정합 (N5)
12. 권한 거부·디바이스 부재 graceful fallback 검증, 통합 성능 재프로파일링 (FPS/지연 유지 확인)
13. (Optional) 운동 시작 딥링크(`visualpt://workout/{exercise}`) 구성 (N1 Optional)

---

## 6. 위험 분석 및 완화 전략

| 위험 | 영향 | 완화 전략 |
|------|------|----------|
| **react-navigation + New Architecture 호환성** — Fabric 환경에서 `react-native-screens`/네이티브 스택 초기 렌더 이슈 가능 | High | New Arch 호환 버전(react-native-screens 4.x, react-navigation 8.x) 명시적 선택, `/moai:2-run`에서 최소 화면으로 PoC 검증 후 화면 확장 |
| **vision-camera 프레임 프로세서 셋업** — worklets-core/babel 플러그인 구성, 네이티브 포즈 플러그인 등록 누락 시 프레임 프로세서 미동작 | High | babel 플러그인(`react-native-worklets-core/plugin`) 및 vision-camera plugin 설정 점검 체크리스트화, 프레임 프로세서 단독 동작(콘솔 로그)부터 단계적 연결 |
| **카메라 실연결 후 성능 저하** — 라이브 프레임 + 추론 + SVG 오버레이 동시 부하로 FPS 하락 | High | SPEC-UI-001 프레임 샘플링(2프레임당 1회) 유지, 오버레이는 Reanimated UI 스레드 갱신, 통합 프로파일링으로 게이트 재확인 |
| **prebuild 재생성 리스크** — 신규 네이티브 의존성 추가로 prebuild 시 기존 네이티브 설정(권한·플러그인) 손실 가능 | Medium | `app.json` 권한·plugins 설정 사전 백업·검토, prebuild 후 카메라 권한/vision-camera plugin 재확인 |
| **세션 생명주기 중복** — 화면 재진입/뒤로 가기 반복 시 중복 `startSession`·미정리 추론 루프 | Medium | 마운트/언마운트 useEffect cleanup로 일관 정리, 기존 세션 활성 시 중복 시작 가드 |
| **수동 선택 → 파라미터 전환에 따른 기존 동작 회귀** — 기존 "운동 선택 후 시작" 분기 제거가 SPEC-UI-001 테스트와 충돌 | Medium | CameraScreen 변경 시 기존 컴포넌트 테스트(136개) 영향 분석, 회귀 테스트로 보호 후 리팩터 |
| **라우트 파라미터 타입 누락** — 잘못된 종목 전달 런타임 오류 | Low | `RootStackParamList`로 컴파일 단계 타입 강제(N1 Unwanted), `ExerciseType` 유니온 재사용 |

---

## 7. 예상 복잡도

**SPEC-UI-002: L (Large)**

근거: 신규 내비게이션 인프라 도입(타입 안전 라우팅, 스택 네비게이터, 신규 네이티브 의존성 + prebuild), 2개 신규 화면(Home, WorkoutSelection), 기존 `CameraScreen`의 비자명한 리팩터(수동 선택 → 파라미터, 마운트 자동 세션, 생명주기 정리), 그리고 가장 까다로운 vision-camera 실프레임 프로세서 연결이 결합. 알고리즘 자체(포즈/각도/피드백)는 SPEC-UI-001에서 완료되어 XL은 아니나, 네이티브 통합·생명주기·성능 유지 리스크로 L 수준이다.

---

## 8. 참고: React Navigation + Vision Camera 통합 패턴

- **타입 안전 네비게이션:** react-navigation 공식 가이드는 `ParamList` 타입 + `NativeStackScreenProps`로 `route.params`/`navigation`을 정적 타입화하는 것을 표준으로 권장.
- **native-stack 우선:** `@react-navigation/native-stack`은 네이티브 내비게이션 프리미티브를 사용해 New Architecture에서 JS 스택보다 성능·제스처 정합성이 우수.
- **vision-camera Frame Processor:** 공식 문서는 `useCameraDevice` + `useFrameProcessor` 조합과 worklets-core 기반 워크릿에서 프레임 처리를 권장하며, 결과를 `runOnJS`로 JS 측에 전달하는 패턴이 일반적.
- **마운트 기반 세션 시작:** 화면 진입 파라미터로 도메인 액션을 트리거하는 패턴(`useEffect(mount)` + route params)은 RN 화면-도메인 결합의 정착된 접근.

> 위 패턴들은 `/moai:2-run` 단계에서 WebSearch/Context7로 최신 버전 및 공식 문서를 재검증할 것 (react-navigation 8.x, vision-camera 4.x New Arch 호환 확인 포함).

---

## 9. 다음 단계

- `/moai:2-run SPEC-UI-002` — 내비게이션 쉘 + 카메라 실연결 구현 시작 (DDD/TDD)
- 후속: `SPEC-UI-DB-002` (세션 녹화/분석) SPEC 작성 권장
- `/moai:3-sync SPEC-UI-002` — 구현 후 문서 동기화

> 본 SPEC 디렉토리는 `spec.md`, `plan.md`, `acceptance.md` 3개 파일을 모두 포함한다.
