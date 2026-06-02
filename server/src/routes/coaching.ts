import { Router, Request, Response } from 'express';
import { GeminiService, CoachingRequest } from '../services/GeminiService';

// 코칭 응답 타입
interface CoachingResponse {
  message: string;       // Gemini가 생성한 한국어 코칭 메시지
  exercise: string;
  generatedAt: string;   // ISO 타임스탬프
}

// @MX:ANCHOR: [AUTO] createCoachingRouter — 코칭 라우터 팩토리, app에서 마운트됨
// @MX:REASON: GeminiService 인스턴스를 주입받아 의존성 역전 원칙 준수
export function createCoachingRouter(geminiService: GeminiService | null): Router {
  const router = Router();

  // POST /api/coaching — 세션 데이터 수신 후 Gemini 코칭 메시지 반환
  router.post('/coaching', async (req: Request, res: Response): Promise<void> => {
    // GEMINI_API_KEY 미설정 시 503 반환
    if (!geminiService) {
      res.status(503).json({
        error: 'Gemini API 키가 설정되지 않았습니다. 서버 관리자에게 문의하세요.',
      });
      return;
    }

    const body = req.body as Partial<CoachingRequest>;

    // 입력 유효성 검사
    if (!body.exercise || !['squat', 'deadlift'].includes(body.exercise)) {
      res.status(400).json({
        error: "exercise 필드가 필요하며 'squat' 또는 'deadlift' 중 하나여야 합니다.",
      });
      return;
    }

    if (typeof body.totalReps !== 'number') {
      res.status(400).json({
        error: 'totalReps 필드가 숫자여야 합니다.',
      });
      return;
    }

    try {
      // Gemini API 호출로 코칭 메시지 생성
      const message = await geminiService.generateCoaching(body as CoachingRequest);

      const response: CoachingResponse = {
        message,
        exercise: body.exercise,
        generatedAt: new Date().toISOString(),
      };

      res.status(200).json(response);
    } catch (error) {
      // Gemini API 오류 처리 — 내부 상세 정보 노출 방지
      console.error('[coaching] Gemini API 호출 실패:', error);
      res.status(500).json({
        error: '코칭 메시지 생성에 실패했습니다.',
      });
    }
  });

  return router;
}
