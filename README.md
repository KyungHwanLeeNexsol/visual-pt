# Visual PT (비주얼 퍼스널 트레이닝)

> 집에서도 전문가 수준의 운동 폼 교정과 AI 코칭을 받으세요

Visual PT는 스마트폰 카메라와 AI 컴퓨터 비전 기술을 활용하여 **실시간으로 운동 폼을 분석**하고 **개인 트레이너 수준의 피드백**을 제공하는 React Native 모바일 애플리케이션입니다.

---

## 주요 기능

- **실시간 자세 분석**: MediaPipe를 사용한 관절 각도 계산 및 오류 감지
- **AI 음성/시각 피드백**: "무릎을 더 구부리세요" 형태의 실시간 교정 메시지
- **해부학 설명**: 운동 오류에 대한 근육/생체역학 기반 지식 제공
- **세션 기록 및 분석**: 운동 영상 재생, 진행 추적, 개선사항 정리
- **AI 챗봇**: Gemini API를 통한 전문 지식 기반 Q&A

---

## 프로젝트 구조

```
visual-pt/
├── mobile/                    # React Native 모바일 앱 (iOS/Android)
│   ├── src/
│   │   ├── screens/          # 앱 화면 (홈, 운동선택, 카메라, 분석)
│   │   ├── services/         # 비즈니스 로직 (자세 분석, API, 피드백)
│   │   ├── components/       # 재사용 가능한 UI 컴포넌트
│   │   ├── store/            # Zustand 상태 관리
│   │   ├── types/            # TypeScript 타입 정의
│   │   ├── utils/            # 유틸리티 함수
│   │   └── config/           # 앱 설정 (API 엔드포인트, 임계값)
│   └── package.json
│
├── server/                    # Node.js + Express 백엔드
│   ├── src/
│   │   ├── api/              # API 라우트 정의
│   │   ├── services/         # 비즈니스 로직 (분석, 피드백, RAG)
│   │   ├── models/           # 데이터베이스 모델
│   │   ├── middleware/       # 인증, 검증, 에러 처리
│   │   └── config/           # 서버 설정
│   ├── package.json
│   └── .env.example
│
├── .moai/                     # 프로젝트 설정 및 문서
│   └── project/              # 제품 정의, 기술 스택, 구조
│
└── README.md                  # 이 파일
```

---

## 시작하기

### 필수 요구사항

- **Node.js** 20.x LTS 이상
- **npm** 또는 **yarn**
- **Git** 2.40+
- **iOS/Android 개발 환경** (선택)
  - iOS: Xcode 및 iOS Simulator
  - Android: Android Studio 및 Android Emulator

### 모바일 앱 설정

```bash
# 1. 저장소 클론
git clone <repository-url>
cd visual-pt/mobile

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행
npx expo start

# 4. iOS/Android 선택
# i (iOS Simulator) 또는 a (Android Emulator) 입력
```

### 백엔드 서버 설정

```bash
# 1. 서버 디렉토리로 이동
cd visual-pt/server

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
cp .env.example .env
# .env 파일 편집 (API 키, 데이터베이스 URL 등)

# 4. 개발 서버 실행
npm run dev
# http://localhost:3000에서 실행됨
```

---

## 기술 스택

### 모바일 (React Native + TypeScript)

| 패키지 | 목적 | 버전 |
|--------|------|------|
| `react-native` | 핵심 프레임워크 | 0.74+ |
| `typescript` | 타입 안전 | 5.3+ |
| `zustand` | 상태 관리 | 4.x |
| `react-native-vision-camera` | 카메라 + 프레임 처리 | 4.x |
| `react-native-mediapipe-posedetection` | 자세 인식 | 0.4.x |
| `@react-navigation/native` | 내비게이션 | 6.x |
| `axios` | HTTP 클라이언트 | 1.6+ |

### 백엔드 (Node.js + Express)

| 패키지 | 목적 | 버전 |
|--------|------|------|
| `express` | 웹 프레임워크 | 4.18+ |
| `typescript` | 타입 안전 | 5.3+ |
| `typeorm` | ORM | 0.3+ |
| `@anthropic-ai/sdk` | Claude API | 0.20+ |
| `redis` | 캐싱 및 세션 | 4.6+ |
| `jsonwebtoken` | JWT 인증 | 9.x |

### 데이터베이스 및 서비스

- **PostgreSQL 15+**: 사용자, 세션, 분석 데이터 저장
- **Redis 7+**: 세션 캐싱 및 상태 관리
- **Google Gemini API**: AI 기반 피드백 및 RAG 질의
- **MediaPipe**: 실시간 자세 추정 (온디바이스, 클라우드 없음)

---

## 개발 현황

### 구현 완료

- **SPEC-UI-001**: 실시간 자세 추정 및 폼 교정 코어 구현
  - 관절 각도 계산 (`mathHelpers.ts`)
  - 피드백 생성 (`FeedbackService`)
  - 운동 메타데이터 (`exercise.catalog.ts`)

- **SPEC-UI-002**: 앱 내비게이션 쉘 및 실제 카메라 연결
  - 홈 화면 (`HomeScreen.tsx`)
  - 운동 선택 화면 (`WorkoutSelectionScreen.tsx`)
  - 실제 카메라 연결 (`CameraScreen.tsx`)
  - 네이티브 스택 내비게이터 (`RootNavigator.tsx`)

- **SPEC-ENHANCE-001**: 피드백 시스템 고도화
  - 음성 피드백 (`AudioFeedbackService`)
  - 세션 분석 및 저장

### 다음 단계

- [ ] 백엔드 API 완성 (세션 저장, 사용자 인증)
- [ ] Claude/Gemini API 통합 (고급 피드백)
- [ ] 세션 재생 및 비교 기능
- [ ] iOS/Android 실제 배포 준비

---

## API 엔드포인트

### 운동 관리
- `GET /api/workouts` - 지원 운동 목록
- `POST /api/workouts/:id/sessions` - 새 세션 시작

### 세션 기록 및 분석
- `POST /api/sessions` - 세션 생성
- `PUT /api/sessions/:id` - 자세 데이터 업데이트
- `POST /api/sessions/:id/analyze` - 백엔드 분석 트리거
- `GET /api/sessions/:id/analysis` - 분석 결과 조회

### 피드백 및 지식
- `GET /api/feedback/:sessionId` - 세션 피드백 조회
- `POST /api/knowledge/query` - RAG 기반 질의

### 사용자 관리
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/users/profile` - 사용자 프로필 조회

---

## 배포

### 모바일 앱 빌드

```bash
cd mobile

# Expo를 통한 iOS/Android 빌드
eas build --platform ios --platform android

# 또는 로컬 빌드
npm run build:ios      # iOS
npm run build:android  # Android
```

### 백엔드 배포

**Vercel (권장)**
```bash
cd server
vercel deploy
```

**Docker 컨테이너**
```bash
cd server
docker build -t visual-pt-api .
docker run -p 3000:3000 visual-pt-api
```

---

## 환경 변수

### 모바일 앱 (`.env`)

```env
REACT_APP_API_URL=http://localhost:3000
REACT_APP_GEMINI_API_KEY=your_gemini_key_here
```

### 백엔드 (`.env`)

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/visual_pt
REDIS_URL=redis://localhost:6379
ANTHROPIC_API_KEY=your_claude_api_key_here
JWT_SECRET=your_jwt_secret_here
```

---

## 테스트

### 모바일 앱 테스트

```bash
cd mobile
npm test                    # 모든 테스트 실행
npm test -- --coverage      # 커버리지 리포트
```

### 백엔드 테스트

```bash
cd server
npm test                    # 모든 테스트 실행
npm test -- --coverage      # 커버리지 리포트
npm run test:integration    # 통합 테스트
```

---

## 프로젝트 문서

프로젝트 구조 및 설정에 대한 자세한 정보는 `.moai/project/` 디렉토리를 참조하세요:

- **product.md** - 제품 정의 및 타겟 사용자
- **tech.md** - 기술 스택 상세 설명
- **structure.md** - 프로젝트 디렉토리 구조

---

## 지원 운동 (MVP)

1. **스쿼트 (Squat)** - 대다리 강화, 코어 운동의 기본
2. **데드리프트 (Deadlift)** - 전체 신체 강화, 등/다리 운동

향후 더 많은 운동이 추가될 예정입니다.

---

## 면책사항

⚠️ **Visual PT는 의료 진단 또는 치료 도구가 아닙니다.**

- 이 앱의 피드백은 정보 제공 목적이며, 의료 전문가의 진단을 대체할 수 없습니다
- 기존 부상이 있거나 의료 상태가 있는 경우, 운동을 시작하기 전에 의료 전문가와 상담하십시오
- 사용자는 본인의 건강 상태를 인식하고 책임감 있게 사용해야 합니다

---

## 문의 및 지원

문제가 발생하거나 기능 제안이 있으시면 이슈를 생성해주세요.

---

**마지막 업데이트:** 2026년 6월 2일  
**라이센스:** MIT
