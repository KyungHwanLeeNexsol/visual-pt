// SPEC-ENHANCE-001 E3: AICoachingService 단위 테스트

import { AICoachingService } from '../../services/AICoachingService';
import type { SessionSummary } from '../../services/SessionAnalyticsService';

// 테스트용 기본 세션 요약 픽스처
const makeSessionSummary = (overrides?: Partial<SessionSummary>): SessionSummary => ({
  exercise: 'squat',
  totalReps: 10,
  avgAngles: { leftKnee: 95, leftHip: 80 },
  errorFrequency: { SPINE_MISALIGNMENT: 3, KNEE_ANGLE_OUT_OF_RANGE: 1 },
  sessionDurationMs: 120_000,
  snapshotCount: 240,
  ...overrides,
});

describe('AICoachingService', () => {
  let service: AICoachingService;

  beforeEach(() => {
    jest.restoreAllMocks();
    service = new AICoachingService('http://test-server:3001');
  });

  // --- 성공 케이스 ---

  it('백엔드 성공 응답 시 isFromAI=true와 서버 메시지를 반환해야 함', async () => {
    // fetch 모킹: 200 응답
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Gemini가 생성한 코칭 메시지' }),
    } as unknown as Response);

    const result = await service.getCoaching(makeSessionSummary());

    expect(result.isFromAI).toBe(true);
    expect(result.message).toBe('Gemini가 생성한 코칭 메시지');
  });

  // --- 네트워크 실패 케이스 ---

  it('네트워크 오류 시 isFromAI=false인 폴백을 반환해야 함', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network request failed'));

    const result = await service.getCoaching(makeSessionSummary());

    expect(result.isFromAI).toBe(false);
    expect(result.message).toContain('스쿼트');
    expect(result.message).toContain('10회');
  });

  // --- 타임아웃 케이스 ---

  it('AbortError 발생(타임아웃) 시 isFromAI=false인 폴백을 반환해야 함', async () => {
    // AbortController.abort()가 호출될 때 발생하는 AbortError 시뮬레이션
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(abortError);

    const result = await service.getCoaching(makeSessionSummary());

    expect(result.isFromAI).toBe(false);
    expect(result.message).toBeTruthy();
  });

  // --- 비-200 응답 케이스 ---

  it('500 응답 시 isFromAI=false인 폴백을 반환해야 함', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    const result = await service.getCoaching(makeSessionSummary());

    expect(result.isFromAI).toBe(false);
  });

  it('404 응답 시 isFromAI=false인 폴백을 반환해야 함', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    const result = await service.getCoaching(makeSessionSummary());

    expect(result.isFromAI).toBe(false);
  });

  // --- 폴백 메시지 내용 검증 ---

  describe('buildFallback 폴백 메시지', () => {
    beforeEach(() => {
      // 항상 폴백이 실행되도록 네트워크 오류 모킹
      jest.spyOn(global, 'fetch').mockRejectedValue(new Error('offline'));
    });

    it('스쿼트 + 오류 없음: 훌륭한 자세 메시지를 반환해야 함', async () => {
      const summary = makeSessionSummary({ exercise: 'squat', errorFrequency: {} });
      const result = await service.getCoaching(summary);

      expect(result.message).toContain('스쿼트');
      expect(result.message).toContain('훌륭한 자세');
    });

    it('데드리프트 + 오류 없음: 데드리프트 메시지를 반환해야 함', async () => {
      const summary = makeSessionSummary({ exercise: 'deadlift', errorFrequency: {}, totalReps: 5 });
      const result = await service.getCoaching(summary);

      expect(result.message).toContain('데드리프트');
      expect(result.message).toContain('5회');
    });

    it('SPINE_MISALIGNMENT 오류가 많을 때 척추 중립 조언을 포함해야 함', async () => {
      const summary = makeSessionSummary({
        errorFrequency: { SPINE_MISALIGNMENT: 5, KNEE_ANGLE_OUT_OF_RANGE: 1 },
      });
      const result = await service.getCoaching(summary);

      expect(result.message).toContain('척추 중립');
    });

    it('KNEE_ANGLE_OUT_OF_RANGE 오류가 많을 때 무릎 각도 조언을 포함해야 함', async () => {
      const summary = makeSessionSummary({
        errorFrequency: { KNEE_ANGLE_OUT_OF_RANGE: 8, SPINE_MISALIGNMENT: 2 },
      });
      const result = await service.getCoaching(summary);

      expect(result.message).toContain('무릎 각도');
    });

    it('SHOULDER_IMBALANCE 오류가 많을 때 어깨 균형 조언을 포함해야 함', async () => {
      const summary = makeSessionSummary({
        errorFrequency: { SHOULDER_IMBALANCE: 6 },
      });
      const result = await service.getCoaching(summary);

      expect(result.message).toContain('어깨 균형');
    });
  });
});
