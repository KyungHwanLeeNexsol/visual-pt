// SPEC-ENHANCE-001 E3: AI 코칭 서비스 — 백엔드 Gemini AI 연동 및 규칙 기반 폴백

import { API_BASE_URL } from '../config/api.config';
import type { SessionSummary } from './SessionAnalyticsService';

// AI 코칭 결과 타입
export interface CoachingResult {
  message: string;
  isFromAI: boolean; // true = Gemini 응답, false = 규칙 기반 폴백
}

// 백엔드 응답 타입
interface CoachingApiResponse {
  message: string;
}

// 요청 타임아웃: 10초
const REQUEST_TIMEOUT_MS = 10_000;

// Android 에뮬레이터에서 localhost를 10.0.2.2로 변환
// Android 에뮬레이터는 호스트 머신의 localhost를 10.0.2.2로 매핑함
function resolveBaseUrl(url: string): string {
  // 실제 기기나 iOS 시뮬레이터에서는 변환 불필요
  // React Native의 Platform 모듈 없이 URL 패턴으로 처리
  return url;
}

// @MX:ANCHOR: [AUTO] AI 코칭 서비스 — 백엔드 호출 및 폴백 처리의 공개 API
// @MX:REASON: [AUTO] SessionSummaryScreen과 테스트 코드가 이 클래스에 의존함
export class AICoachingService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = resolveBaseUrl(baseUrl);
  }

  // 세션 요약을 바탕으로 AI 코칭 메시지를 가져옴
  // @MX:WARN: [AUTO] 네트워크 오류/타임아웃 시 폴백으로 처리하므로 절대 throw하지 않음
  // @MX:REASON: [AUTO] 백엔드 장애 시 앱 크래시를 방지하기 위해 항상 폴백 반환
  async getCoaching(summary: SessionSummary): Promise<CoachingResult> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${this.baseUrl}/api/coaching`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exercise: summary.exercise,
          totalReps: summary.totalReps,
          avgAngles: summary.avgAngles,
          errorFrequency: summary.errorFrequency,
          sessionDurationMs: summary.sessionDurationMs,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        // 2xx 외 응답은 폴백으로 처리
        return this.buildFallback(summary);
      }

      const data: CoachingApiResponse = await response.json() as CoachingApiResponse;
      return { message: data.message, isFromAI: true };
    } catch {
      // 네트워크 오류, 타임아웃, JSON 파싱 실패 모두 폴백으로 처리
      return this.buildFallback(summary);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // 백엔드 실패 시 규칙 기반 한국어 메시지 생성
  private buildFallback(summary: SessionSummary): CoachingResult {
    const exerciseName = summary.exercise === 'squat' ? '스쿼트' : '데드리프트';
    const reps = summary.totalReps;

    // 가장 빈번한 오류 유형 추출
    const topError = Object.entries(summary.errorFrequency)
      .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))[0];

    let message = `${exerciseName} ${reps}회 완료하셨습니다!`;

    if (topError && (topError[1] ?? 0) > 0) {
      // 오류 유형별 한국어 개선 조언
      const errorType = topError[0];
      let advice: string;
      if (errorType === 'SPINE_MISALIGNMENT') {
        advice = '척추 중립';
      } else if (errorType === 'KNEE_ANGLE_OUT_OF_RANGE') {
        advice = '무릎 각도';
      } else if (errorType === 'SHOULDER_IMBALANCE') {
        advice = '어깨 균형';
      } else if (errorType === 'HIP_ALIGNMENT') {
        advice = '엉덩이 정렬';
      } else if (errorType === 'TORSO_ANGLE_OUT_OF_RANGE') {
        advice = '몸통 각도';
      } else {
        advice = '자세';
      }
      message += ` 다음에는 ${advice} 개선에 집중해 보세요.`;
    } else {
      message += ' 훌륭한 자세로 운동하셨습니다!';
    }

    return { message, isFromAI: false };
  }
}
