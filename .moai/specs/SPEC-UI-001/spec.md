---
id: SPEC-UI-001
version: "1.0.0"
status: draft
created: "2026-06-01"
updated: "2026-06-01"
author: "Visual PT Team"
priority: high
issue_number: 0
---

# SPEC-UI-001: 실시간 자세 추정 및 폼 교정 코어

## HISTORY
| 버전 | 날짜 | 변경사항 | 작성자 |
|------|------|---------|-------|
| 1.0.0 | 2026-06-01 | 초안 작성 | Visual PT Team |

## 개요

본 SPEC은 모바일 카메라를 통해 사용자의 운동 자세를 실시간으로 추정하고, 관절 각도를 분석하여 폼 오류를 감지하고, 시각·음성 피드백을 제공하는 **단일 프레임 처리 파이프라인**을 정의한다.

**해결하는 문제:**
개인 운동 시 전문 트레이너 없이 자세 교정이 어렵다. 잘못된 폼은 운동 효과 저하와 부상 위험을 초래한다. 본 코어는 온디바이스 ML로 실시간 자세 분석과 즉각적 폼 교정 피드백을 제공하여 이 문제를 해결한다.

**범위 (In-Scope):**
- `CameraScreen.tsx` 위에서 동작하는 실시간 추론 루프
- MediaPipe Pose 기반 33개 관절 키포인트 온디바이스 추출 (M1)
- 무릎·엉덩이·척추·어깨 각도 벡터 연산 및 운동별 폼 오류 분류 (M2)
- 텍스트·음성 멀티모달 실시간 피드백, 디바운스 처리 (M3)
- SVG 스켈레톤 오버레이 및 오류 관절 강조 (M4)
- 카메라 배치 가이드 및 앵글 적정성 경고 (M5)
- MVP 대상 운동: 스쿼트, 데드리프트

**범위 외 (Out-of-Scope):**
- 운동 세션 녹화·저장·재생 및 분석 보고서 (별도 SPEC-UI-DB-002에서 다룸)
- 백엔드 업로드 및 클라우드 동기화
- 사용자 계정·인증
- 스쿼트/데드리프트 외 추가 운동 종목 (확장 가능 구조로 설계하되 본 SPEC 미포함)
- 3D 깊이 센서 기반 분석 (2D 카메라 한정)

---

## 요구사항

### M1. 포즈 추정 파이프라인 (Pose Estimation)

- **Ubiquitous:** 시스템은 **항상** 활성화된 운동 세션 동안 MediaPipe Pose로 33개 관절 키포인트를 온디바이스에서 추출해야 한다.
- **Event-Driven:** **WHEN** 카메라 프레임이 도착하면 **THEN** 시스템은 단일 프레임에 대한 키포인트 추론을 100ms 이내에 완료해야 한다.
- **Unwanted:** **IF** 추론 신뢰도(visibility)가 임계값 미만인 키포인트가 존재하면 **THEN** 시스템은 해당 관절을 각도 계산에 사용하지 **않아야 한다**.

### M2. 관절 각도 분석 (Joint Angle Analysis)

- **Ubiquitous:** 시스템은 **항상** 추출된 키포인트로부터 무릎·엉덩이·척추·어깨 각도를 3점 벡터 연산(코사인 법칙)으로 계산해야 한다.
- **State-Driven:** **IF** 선택된 운동이 스쿼트이고 무릎 각도가 임계 범위(80~120도)를 벗어나면 **THEN** 시스템은 해당 상태를 폼 오류로 분류해야 한다.
- **State-Driven:** **IF** 선택된 운동이 데드리프트이고 척추 각도가 중립 정렬 임계를 벗어나면 **THEN** 시스템은 해당 상태를 폼 오류로 분류해야 한다.

### M3. 실시간 피드백 시스템 (Real-time Feedback)

- **Event-Driven:** **WHEN** 폼 오류가 감지되면 **THEN** 시스템은 카메라 화면 위에 교정 텍스트 메시지(예: "무릎을 더 펴세요")를 표시해야 한다.
- **Event-Driven:** **WHEN** 폼 오류가 감지되면 **THEN** 시스템은 expo-speech를 통해 음성 피드백을 재생해야 한다.
- **Unwanted:** **IF** 동일 오류가 직전 피드백 후 디바운스 구간(2초) 내에 다시 감지되면 **THEN** 시스템은 중복 음성을 재생하지 **않아야 한다**.

### M4. 스켈레톤 오버레이 (Skeleton Overlay)

- **State-Driven:** **WHILE** 운동 세션이 진행 중인 동안 시스템은 카메라 피드 위에 인체 골격(33관절 연결선)을 30 FPS 이상으로 렌더링해야 한다.
- **State-Driven:** **WHILE** 폼 오류가 활성 상태인 동안 시스템은 문제 관절을 경고 색상(예: 적색)으로 강조 표시해야 한다.

### M5. 카메라 배치 가이드 (Camera Placement Guide)

- **Event-Driven:** **WHEN** 사용자가 운동 화면에 진입하면 **THEN** 시스템은 최적 카메라 위치(측면 45도, 골반 높이) 오버레이 가이드를 표시해야 한다.
- **State-Driven:** **IF** 추정된 카메라 앵글이 분석 정확도 허용 범위를 벗어나면 **THEN** 시스템은 재배치 경고 메시지를 표시해야 한다.
- **Optional:** **가능하면** 시스템은 키포인트 가시성 점수를 기반으로 자동 앵글 적정성 점수를 제공한다.

---

## 비기능 요구사항

### 성능 (Performance)
- 카메라 프레임레이트: 최소 30 FPS 유지
- 프레임당 추론 지연: 100ms 미만
- 피드백 응답 지연(오류 감지 → 표시): 500ms 미만
- 앱 메모리 사용량: 150MB 미만
- 시간당 배터리 영향: 5% 미만

### 신뢰성 (Reliability)
- 저가시성 키포인트는 각도 계산에서 자동 배제하여 오탐 최소화
- 프레임 샘플링(2프레임당 1회 추론)으로 저사양 기기에서도 안정 동작
- 카메라 권한 거부 시 graceful fallback 제공

### 보안·개인정보 (Security & Privacy)
- 모든 ML 추론은 온디바이스에서 수행하며 영상·키포인트를 외부로 전송하지 않음
- 본 SPEC 범위에서 영상 저장·업로드는 발생하지 않음

### 법적·면책 (Legal)
- 2D 카메라 기반 분석의 한계로 인한 각도 오차 가능성을 사용자에게 면책 고지
- 의료·재활 목적의 진단 도구가 아님을 명시

---

## 의존성

| 영역 | 라이브러리 | 권장 버전 | 역할 |
|------|-----------|----------|------|
| 프레임워크 | react-native | 0.74+ (New Architecture) | 코어 모바일 프레임워크 |
| 언어 | typescript | 5.3+ | 타입 안전성 |
| 포즈 추정 | react-native-mediapipe-posedetection | 0.4.x | 온디바이스 33관절 추론 (RN 네이티브 바인딩) |
| 모델 | pose_landmarker_lite.tflite | (3MB) | MVP 저지연 모델 |
| 카메라 | react-native-vision-camera | 4.x | 카메라 스트림 + 프레임 프로세서 API |
| 오버레이 | react-native-svg | 15.x | 스켈레톤·가이드 벡터 렌더링 |
| 애니메이션 | react-native-reanimated | 3.x | UI 스레드 오버레이 갱신 |
| 워크릿 | react-native-worklets-core | 1.x | 프레임 프로세서 워크릿 실행 |
| 음성 | expo-speech | 12.x | TTS 음성 피드백 |
| 상태 관리 | zustand | 4.x | workoutStore / feedbackStore |

> ⚠️ **기술 스택 변경 (구현 단계에서 확정):** `@mediapipe/tasks-vision`은 WebAssembly/브라우저 전용 라이브러리로 React Native에서 동작하지 않아 `react-native-mediapipe-posedetection` v0.4.0으로 교체되었다. `expo-camera`는 프레임 프로세서 API를 지원하지 않아 `react-native-vision-camera` v4로 교체되었다. 이 변경으로 **Expo bare workflow (prebuild)가 필수**가 되었다.

**아키텍처 의존 패턴:**
- 프레임 프로세서 패턴: 추론을 JS 스레드 외부 네이티브 워크릿에서 처리
- Reanimated shared value: 스켈레톤 오버레이를 UI 스레드에서 매 프레임 리렌더 없이 갱신
- 임계값 외부화: 운동별 각도 임계값을 `pose.config.ts` / `feedback.config.ts`로 분리
- 네이티브 포즈 통합: react-native-mediapipe-posedetection v0.4.0 + react-native-vision-camera v4 frame processor 조합으로 구현 (SPEC 명시 expo-camera + tasks-vision 대체)

> 후속 의존 관계: SPEC-UI-DB-002(세션 녹화/분석)는 본 SPEC의 안정적인 포즈 데이터 출력에 의존한다.

---

## 구현 완료

- **구현일:** 2026-06-01
- **상태:** completed
- **테스트:** 136개 통과 (단위·컴포넌트 테스트)
- **인수 기준 충족:** AC-2~9 (AC-1은 실기기 검증 필요)
- **구현된 파일:** 37개 (mobile/src/ 하위)
