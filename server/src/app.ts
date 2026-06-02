// Vercel 서버리스 및 로컬 개발 공통 Express 앱 설정
// app.listen()은 호출하지 않음 — 진입점(index.ts, api/index.ts)에서 담당
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { GeminiService } from './services/GeminiService';
import { createCoachingRouter } from './routes/coaching';

const app = express();

// CORS 설정 — 모바일 에뮬레이터(localhost, Android 10.0.2.2) 허용
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  })
);

app.use(express.json());

// Gemini API 키 수집 — GEMINI_API_KEY_1/2/3 우선, 없으면 GEMINI_API_KEY 단일 키 사용
let geminiService: GeminiService | null = null;

const apiKeys = [
  process.env.GEMINI_API_KEY_1,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
].filter((k): k is string => Boolean(k) && k !== 'your-gemini-api-key-here');

// 키 없으면 단일 키(GEMINI_API_KEY)로 폴백
const fallbackKey = process.env.GEMINI_API_KEY;
if (apiKeys.length === 0 && fallbackKey && fallbackKey !== 'your-gemini-api-key-here') {
  apiKeys.push(fallbackKey);
}

if (apiKeys.length === 0) {
  console.warn(
    '[경고] Gemini API 키가 설정되지 않았습니다. ' +
    '/api/coaching 엔드포인트는 503을 반환합니다.'
  );
} else {
  geminiService = new GeminiService(apiKeys);
  console.log(`[정보] Gemini API 서비스가 ${apiKeys.length}개 키로 초기화되었습니다.`);
}

// 코칭 라우터 마운트
app.use('/api', createCoachingRouter(geminiService));

// 헬스 체크 엔드포인트
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    geminiReady: geminiService !== null,
  });
});

export default app;
