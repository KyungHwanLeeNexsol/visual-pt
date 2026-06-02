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
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  // 운동 세션 데이터를 기반으로 Gemini API 코칭 메시지 생성
  // maxOutputTokens: 200 — 짧은 코칭 메시지 강제, 응답 속도 개선
  async generateCoaching(request: CoachingRequest): Promise<string> {
    const model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        maxOutputTokens: 200,
        temperature: 0.7,
      },
    });
    const prompt = this.buildPrompt(request);
    const result = await model.generateContent(prompt);
    return result.response.text();
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
