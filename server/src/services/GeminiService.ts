import { GoogleGenerativeAI } from '@google/generative-ai';

// 코칭 요청 데이터 타입
export interface CoachingRequest {
  exercise: 'squat' | 'deadlift';
  totalReps: number;
  sessionDurationMs: number;
  avgAngles: {
    leftKnee?: number;
    rightKnee?: number;
    leftHip?: number;
    rightHip?: number;
    spine?: number;
    torsoAngle?: number;
  };
  errorFrequency: Record<string, number>;
}

// @MX:ANCHOR: [AUTO] GeminiService — Gemini API 호출의 단일 진입점, 여러 라우터에서 참조됨
// @MX:REASON: coaching 라우터와 향후 추가될 분석 엔드포인트에서 공유 사용
export class GeminiService {
  // 여러 API 키를 보관 — 429 발생 시 다음 키로 자동 전환
  private apiKeys: string[];

  // 단일 키 또는 키 배열 모두 허용 (하위 호환)
  constructor(apiKeys: string | string[]) {
    this.apiKeys = Array.isArray(apiKeys) ? apiKeys : [apiKeys];
  }

  // 운동 세션 데이터를 기반으로 Gemini API 코칭 메시지 생성
  // 429 Rate Limit 발생 시 다음 키로 자동 폴백
  async generateCoaching(request: CoachingRequest): Promise<string> {
    const prompt = this.buildPrompt(request);
    let lastError: Error | null = null;

    // 랜덤 시작점으로 키 순서 섞기 — 서버리스 환경에서 고른 부하 분산
    for (const apiKey of this.shuffledKeys()) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            maxOutputTokens: 200,
            temperature: 0.7,
          },
        });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error) {
        if (this.isRateLimitError(error)) {
          // 429: 다음 키로 재시도
          lastError = error instanceof Error ? error : new Error(String(error));
          console.warn(`[경고] API 키 사용량 초과, 다음 키로 전환합니다.`);
          continue;
        }
        // 429 외의 오류는 즉시 전파
        throw error;
      }
    }

    throw lastError ?? new Error('모든 Gemini API 키가 사용량 한도를 초과했습니다.');
  }

  // 랜덤 시작점에서 순환하는 키 배열 반환 — 공정한 부하 분산
  private shuffledKeys(): string[] {
    const start = Math.floor(Math.random() * this.apiKeys.length);
    return [...this.apiKeys.slice(start), ...this.apiKeys.slice(0, start)];
  }

  // 429 Rate Limit 오류 여부 판별
  private isRateLimitError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    const msg = error.message.toLowerCase();
    return msg.includes('429') || msg.includes('rate limit') || msg.includes('quota exceeded');
  }

  // 운동 데이터를 한국어 코칭 프롬프트로 변환
  private buildPrompt(request: CoachingRequest): string {
    const exerciseName = request.exercise === 'squat' ? '스쿼트' : '데드리프트';
    const durationSec = Math.round(request.sessionDurationMs / 1000);

    // 오류 빈도 상위 3개 추출
    const topErrors = Object.entries(request.errorFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => `${type}: ${count}회`)
      .join(', ');

    return `당신은 퍼스널 트레이너입니다. 운동 세션 데이터를 분석하고 한국어로 간결하고 구체적인 코칭 피드백을 제공해주세요.

운동: ${exerciseName}
세션 시간: ${durationSec}초
총 횟수: ${request.totalReps}회
주요 오류: ${topErrors || '없음'}
평균 각도:
- 왼쪽 무릎: ${request.avgAngles.leftKnee?.toFixed(1) ?? '측정 불가'}°
- 왼쪽 엉덩이: ${request.avgAngles.leftHip?.toFixed(1) ?? '측정 불가'}°
- 척추: ${request.avgAngles.spine?.toFixed(1) ?? '측정 불가'}°

3-4문장으로 핵심 개선 포인트와 칭찬을 포함한 피드백을 작성해주세요. 의료적 진단은 하지 마세요.`;
  }
}
