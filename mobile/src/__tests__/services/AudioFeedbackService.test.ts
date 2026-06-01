// SPEC-UI-001: AudioFeedbackService 단위 테스트 (AC-5, AC-6 디바운스)

import { AudioFeedbackService, type SpeechService } from '../../services/AudioFeedbackService';
import type { FeedbackMessage } from '../../types/feedback.types';

// 테스트용 mock SpeechService
function makeMockSpeechService(): jest.Mocked<SpeechService> {
  return {
    speak: jest.fn().mockResolvedValue(undefined),
    isSpeaking: jest.fn().mockResolvedValue(false),
    stop: jest.fn().mockResolvedValue(undefined),
  };
}

function makeMessage(errorType: FeedbackMessage['errorType'], text = '테스트 메시지'): FeedbackMessage {
  return {
    id: `msg-${Date.now()}-${Math.random()}`,
    errorType,
    text,
    speechText: text,
    severity: 'warning',
    timestamp: Date.now(),
  };
}

describe('AudioFeedbackService', () => {
  let mockSpeech: jest.Mocked<SpeechService>;
  let service: AudioFeedbackService;

  beforeEach(() => {
    jest.useFakeTimers();
    mockSpeech = makeMockSpeechService();
    service = new AudioFeedbackService(mockSpeech);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('AC-5: 첫 번째 호출은 TTS를 실행하고 true를 반환한다', () => {
    it('첫 번째 playFeedback 호출 → speak 실행 + true 반환', async () => {
      const msg = makeMessage('KNEE_ANGLE_OUT_OF_RANGE', '무릎을 더 펴세요');
      const result = await service.playFeedback(msg);
      expect(result).toBe(true);
      expect(mockSpeech.speak).toHaveBeenCalledWith('무릎을 더 펴세요');
      expect(mockSpeech.speak).toHaveBeenCalledTimes(1);
    });
  });

  describe('AC-6: 디바운스 동작', () => {
    it('같은 errorType 2초 이내 재호출 → false 반환 (speak 호출 안 됨)', async () => {
      const msg = makeMessage('KNEE_ANGLE_OUT_OF_RANGE', '무릎을 더 펴세요');
      await service.playFeedback(msg);
      mockSpeech.speak.mockClear();

      // 1초 경과 (2초 미만)
      jest.advanceTimersByTime(1000);

      const result = await service.playFeedback(msg);
      expect(result).toBe(false);
      expect(mockSpeech.speak).not.toHaveBeenCalled();
    });

    it('같은 errorType 2초 이후 재호출 → true 반환 (speak 실행)', async () => {
      const msg = makeMessage('KNEE_ANGLE_OUT_OF_RANGE', '무릎을 더 펴세요');
      await service.playFeedback(msg);
      mockSpeech.speak.mockClear();

      // 2초 경과
      jest.advanceTimersByTime(2000);

      const result = await service.playFeedback(msg);
      expect(result).toBe(true);
      expect(mockSpeech.speak).toHaveBeenCalledTimes(1);
    });

    it('다른 errorType은 2초 이내에도 재생 가능 → true 반환', async () => {
      const kneeMsg = makeMessage('KNEE_ANGLE_OUT_OF_RANGE', '무릎을 더 펴세요');
      const spineMsg = makeMessage('SPINE_MISALIGNMENT', '척추를 중립으로 유지하세요');

      await service.playFeedback(kneeMsg);
      mockSpeech.speak.mockClear();

      // 500ms 경과 (2초 미만)
      jest.advanceTimersByTime(500);

      const result = await service.playFeedback(spineMsg);
      expect(result).toBe(true);
      expect(mockSpeech.speak).toHaveBeenCalledWith('척추를 중립으로 유지하세요');
    });

    it('isDebounced: 디바운스 활성 상태이면 true를 반환한다', async () => {
      const msg = makeMessage('KNEE_ANGLE_OUT_OF_RANGE');
      await service.playFeedback(msg);

      expect(service.isDebounced('KNEE_ANGLE_OUT_OF_RANGE')).toBe(true);
    });

    it('isDebounced: 2초 경과 후 false를 반환한다', async () => {
      const msg = makeMessage('KNEE_ANGLE_OUT_OF_RANGE');
      await service.playFeedback(msg);

      jest.advanceTimersByTime(2000);

      expect(service.isDebounced('KNEE_ANGLE_OUT_OF_RANGE')).toBe(false);
    });

    it('isDebounced: 아직 재생하지 않은 errorType은 false를 반환한다', () => {
      expect(service.isDebounced('SPINE_MISALIGNMENT')).toBe(false);
    });
  });

  describe('resetDebounce', () => {
    it('특정 errorType 디바운스 초기화', async () => {
      const msg = makeMessage('KNEE_ANGLE_OUT_OF_RANGE');
      await service.playFeedback(msg);

      service.resetDebounce('KNEE_ANGLE_OUT_OF_RANGE');

      expect(service.isDebounced('KNEE_ANGLE_OUT_OF_RANGE')).toBe(false);
    });

    it('인자 없이 호출하면 모든 디바운스 초기화', async () => {
      const msg1 = makeMessage('KNEE_ANGLE_OUT_OF_RANGE');
      const msg2 = makeMessage('SPINE_MISALIGNMENT');
      await service.playFeedback(msg1);
      await service.playFeedback(msg2);

      service.resetDebounce();

      expect(service.isDebounced('KNEE_ANGLE_OUT_OF_RANGE')).toBe(false);
      expect(service.isDebounced('SPINE_MISALIGNMENT')).toBe(false);
    });
  });

  describe('SpeechService 미주입 시 기본 동작', () => {
    it('speechService 없이 생성해도 크래시 없음', async () => {
      const svc = new AudioFeedbackService();
      const msg = makeMessage('KNEE_ANGLE_OUT_OF_RANGE', '테스트');
      // expo-speech 모킹이 없으므로 에러가 날 수 있으나 크래시 없어야 함
      await expect(svc.playFeedback(msg)).resolves.not.toThrow();
    });
  });
});
