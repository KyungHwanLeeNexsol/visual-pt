# Visual PT Gemini API 프록시 서버

Visual PT 모바일 앱을 위한 Gemini API 프록시 백엔드 서버입니다. 클라이언트에서 API 키를 직접 노출하지 않도록 하면서 운동 세션 데이터를 분석하여 한국어 코칭 피드백을 생성합니다.

## 개요

이 서버는 다음을 담당합니다:

- **API 키 관리**: 최대 4개의 Gemini API 키를 지원하며, 429 rate limit 발생 시 자동으로 다음 키로 전환
- **세션 분석**: 운동 데이터(각도, 반복 횟수, 오류 빈도)를 받아 Gemini API로 분석
- **코칭 피드백**: 한국어로 개인화된 운동 코칭 메시지 생성
- **보안**: 모바일 클라이언트에서 민감한 API 키 노출 방지

## 엔드포인트

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/coaching` | 운동 세션 데이터를 받아 Gemini 코칭 메시지 반환 |
| `GET` | `/health` | 서버 상태 및 Gemini API 준비 여부 확인 |

### POST /api/coaching

**요청 Body:**

```json
{
  "exercise": "squat" | "deadlift",
  "totalReps": 10,
  "sessionDurationMs": 45000,
  "avgAngles": {
    "leftKnee": 85.5,
    "rightKnee": 86.2,
    "leftHip": 95.1,
    "rightHip": 94.8,
    "spine": 92.3,
    "torsoAngle": 88.0
  },
  "errorFrequency": {
    "kneeValgus": 2,
    "lowerBack": 1
  }
}
```

**응답 (200):**

```json
{
  "message": "좋은 스쿼트 폼입니다! ...",
  "exercise": "squat",
  "generatedAt": "2026-01-15T10:30:00Z"
}
```

**에러 응답:**

- `400`: 입력 유효성 오류
- `503`: Gemini API 키 미설정
- `500`: API 호출 실패

### GET /health

**응답:**

```json
{
  "status": "ok",
  "geminiReady": true
}
```

## 환경변수 설정

### 개발/운영 환경

`.env` 파일에 다음 변수를 설정합니다:

| 변수 | 필수 | 설명 |
|------|------|------|
| `GEMINI_API_KEY_1` | Yes | 첫 번째 Gemini API 키 |
| `GEMINI_API_KEY_2` | No | 두 번째 Gemini API 키 (429 자동 전환용) |
| `GEMINI_API_KEY_3` | No | 세 번째 Gemini API 키 (429 자동 전환용) |
| `GEMINI_API_KEY_4` | No | 네 번째 Gemini API 키 (429 자동 전환용) |
| `GEMINI_API_KEY` | No | 단일 키 폴백 (위 4개 미설정 시) |
| `PORT` | No | 서버 포트 (기본값: 3001) |

### API 키 로테이션 구조

GeminiService는 429 rate limit 에러 발생 시 다음 동작을 합니다:

1. 현재 키로 요청 시도
2. 429 에러 받으면 다음 키로 자동 전환
3. 모든 키가 rate limit에 걸리면 에러 발생
4. 서버리스 환경에서 고른 부하 분산을 위해 매 요청마다 키 순서를 무작위 섞음

예시:
```
요청 1: GEMINI_API_KEY_2 → 429 에러 → GEMINI_API_KEY_3 시도
요청 2: GEMINI_API_KEY_4 → 성공
요청 3: GEMINI_API_KEY_1 → 성공 (다시 섞임)
```

## 로컬 개발

### 설치

```bash
cd server
npm install
```

### 환경변수 준비

```bash
cp .env.example .env
# .env 파일을 열어 실제 Gemini API 키 입력
# GEMINI_API_KEY_1은 필수, 나머지는 선택
```

[Gemini API 키 생성 가이드](https://ai.google.dev/tutorials/setup)

### 개발 서버 실행

```bash
npm run dev
```

서버는 `http://localhost:3001`에서 시작합니다.

### 테스트

```bash
# 헬스 체크
curl http://localhost:3001/health

# 코칭 요청
curl -X POST http://localhost:3001/api/coaching \
  -H "Content-Type: application/json" \
  -d '{
    "exercise": "squat",
    "totalReps": 10,
    "sessionDurationMs": 45000,
    "avgAngles": {
      "leftKnee": 85.5,
      "rightKnee": 86.2,
      "spine": 92.3
    },
    "errorFrequency": {
      "kneeValgus": 2
    }
  }'
```

## Vercel 배포

### 1. 프로젝트 설정

Vercel 대시보드에서 새 프로젝트를 추가하고 다음을 설정합니다:

- **Root Directory**: `server` (중요)
- **Framework**: Node.js
- **Build Command**: `npm run build` (기본값 사용 가능)

### 2. 환경변수 설정

Vercel 프로젝트 Settings → Environment Variables에서 추가:

```
GEMINI_API_KEY_1 = your-first-key
GEMINI_API_KEY_2 = your-second-key  (선택)
GEMINI_API_KEY_3 = your-third-key   (선택)
GEMINI_API_KEY_4 = your-fourth-key  (선택)
```

### 3. 배포

```bash
vercel deploy
```

또는 GitHub에 push하면 자동 배포됩니다.

**참고**: `vercel.json`에 `maxDuration: 60`이 이미 설정되어 있어서 최대 60초 요청 처리를 지원합니다.

## 프로젝트 구조

```
server/
├── src/
│   ├── app.ts                      # Express 앱 설정
│   ├── services/
│   │   └── GeminiService.ts        # Gemini API 클라이언트 (429 자동 전환)
│   └── routes/
│       └── coaching.ts              # POST /api/coaching 엔드포인트
├── api/
│   └── index.ts                    # Vercel 서버리스 진입점
├── .env.example                    # 환경변수 템플릿
├── vercel.json                     # Vercel 배포 설정
├── package.json
├── tsconfig.json
└── README.md
```

## 주요 기능

### 다중 API 키 지원

최대 4개의 API 키를 설정하여 rate limit 회피:

```typescript
// GeminiService 초기화
const apiKeys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
].filter(Boolean);

const geminiService = new GeminiService(apiKeys);
```

### 자동 키 전환 (429 처리)

```typescript
// GeminiService.generateCoaching()에서 429 자동 처리
for (const apiKey of this.shuffledKeys()) {
  try {
    // API 호출
  } catch (error) {
    if (this.isRateLimitError(error)) {
      // 다음 키로 재시도
      continue;
    }
    throw error;
  }
}
```

## 성능 및 제한

- **응답 시간**: 평균 2-5초 (Gemini API 호출 시간 포함)
- **요청 제한**: Gemini API rate limit 기준 (기본값: 분당 60회, 4개 키 사용 시 최대 240회)
- **타임아웃**: Vercel에서 최대 60초 (maxDuration 설정)

## 문제 해결

### 503 Gemini API 키 미설정

```
Gemini API 키가 설정되지 않았습니다. 서버 관리자에게 문의하세요.
```

**해결**: 환경변수 `GEMINI_API_KEY_1` ~ `GEMINI_API_KEY_4` 중 최소 1개 설정

### 429 Rate Limit 반복

모든 API 키가 rate limit에 걸린 경우:

```
모든 Gemini API 키가 사용량 한도를 초과했습니다.
```

**해결**:
1. 추가 API 키 생성하여 환경변수에 추가
2. 요청 간격 증가
3. 프로젝트당 quota 상향 신청 ([Google Cloud Console](https://console.cloud.google.com))

### 400 입력 유효성 오류

요청 body에 필수 필드 누락:
- `exercise`: "squat" 또는 "deadlift" 필수
- `totalReps`: 숫자 필수

### 500 API 호출 실패

**원인**: 429 외의 API 오류 (네트워크, 인증, 할당량 초과 등)

**해결**: 서버 로그 확인 및 Google Cloud Console의 할당량/에러 메시지 확인

## 개발 명령어

```bash
npm run dev      # 개발 서버 실행
npm run build    # 프로덕션 빌드
npm run start    # 빌드된 앱 실행
npm run lint     # ESLint 확인
```

## 라이센스

MIT

## 지원

문제 발생 시 다음을 확인하세요:

1. `.env` 파일에 `GEMINI_API_KEY_1` 설정
2. 네트워크 연결 상태
3. Google Cloud 프로젝트 Gemini API 활성화 여부
4. 할당량 및 결제 정보 확인
