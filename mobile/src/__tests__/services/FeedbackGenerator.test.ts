// SPEC-UI-001: FeedbackGenerator 단위 테스트

import { FeedbackGenerator } from '../../services/FeedbackGenerator';
import type { FormError } from '../../types/feedback.types';

describe('FeedbackGenerator', () => {
  let generator: FeedbackGenerator;

  beforeEach(() => {
    generator = new FeedbackGenerator();
  });

  describe('generateMessages', () => {
    it('빈 에러 배열 → 빈 메시지 배열 반환', () => {
      const messages = generator.generateMessages([], 'squat');
      expect(messages).toHaveLength(0);
    });

    it('KNEE_ANGLE_OUT_OF_RANGE 에러 → "무릎을 더 펴세요" 텍스트 포함 메시지 반환', () => {
      const error: FormError = {
        type: 'KNEE_ANGLE_OUT_OF_RANGE',
        joint: 'leftKnee',
        currentValue: 60,
        expectedRange: [80, 120],
        message: '무릎 각도가 범위를 벗어났습니다',
      };
      const messages = generator.generateMessages([error], 'squat');
      expect(messages).toHaveLength(1);
      expect(messages[0].text).toBe('무릎을 더 펴세요');
      expect(messages[0].speechText).toBe('무릎을 더 펴세요');
    });

    it('SPINE_MISALIGNMENT 에러 → "척추를 중립으로 유지하세요" 텍스트 포함', () => {
      const error: FormError = {
        type: 'SPINE_MISALIGNMENT',
        joint: 'spine',
        currentValue: 140,
        expectedRange: [150, 180],
        message: '척추 정렬이 잘못되었습니다',
      };
      const messages = generator.generateMessages([error], 'deadlift');
      expect(messages).toHaveLength(1);
      expect(messages[0].text).toBe('척추를 중립으로 유지하세요');
    });

    it('SHOULDER_IMBALANCE 에러 → "어깨를 수평으로 유지하세요" 텍스트 포함', () => {
      const error: FormError = {
        type: 'SHOULDER_IMBALANCE',
        joint: 'leftShoulder',
        currentValue: 35,
        expectedRange: [0, 30],
        message: '어깨 불균형',
      };
      const messages = generator.generateMessages([error], 'squat');
      expect(messages[0].text).toBe('어깨를 수평으로 유지하세요');
    });

    it('HIP_ALIGNMENT 에러 → "엉덩이 위치를 교정하세요" 텍스트 포함', () => {
      const error: FormError = {
        type: 'HIP_ALIGNMENT',
        joint: 'leftHip',
        currentValue: 30,
        expectedRange: [45, 135],
        message: '힙 정렬 오류',
      };
      const messages = generator.generateMessages([error], 'squat');
      expect(messages[0].text).toBe('엉덩이 위치를 교정하세요');
    });

    it('여러 에러 → 각 에러에 대한 메시지 반환', () => {
      const errors: FormError[] = [
        {
          type: 'KNEE_ANGLE_OUT_OF_RANGE',
          joint: 'leftKnee',
          currentValue: 60,
          expectedRange: [80, 120],
          message: '무릎 범위 오류',
        },
        {
          type: 'SPINE_MISALIGNMENT',
          joint: 'spine',
          currentValue: 140,
          expectedRange: [150, 180],
          message: '척추 오류',
        },
      ];
      const messages = generator.generateMessages(errors, 'squat');
      expect(messages).toHaveLength(2);
    });

    it('생성된 메시지는 id, errorType, severity, timestamp 필드를 가진다', () => {
      const error: FormError = {
        type: 'KNEE_ANGLE_OUT_OF_RANGE',
        joint: 'leftKnee',
        currentValue: 60,
        expectedRange: [80, 120],
        message: '무릎 범위 오류',
      };
      const messages = generator.generateMessages([error], 'squat');
      const msg = messages[0];
      expect(msg.id).toBeTruthy();
      expect(msg.errorType).toBe('KNEE_ANGLE_OUT_OF_RANGE');
      expect(['warning', 'error']).toContain(msg.severity);
      expect(msg.timestamp).toBeGreaterThan(0);
    });
  });

  describe('errorToMessage', () => {
    it('FormError 를 FeedbackMessage 로 변환한다', () => {
      const error: FormError = {
        type: 'KNEE_ANGLE_OUT_OF_RANGE',
        joint: 'leftKnee',
        currentValue: 60,
        expectedRange: [80, 120],
        message: '무릎 각도 오류',
      };
      const message = generator.errorToMessage(error);
      expect(message.errorType).toBe('KNEE_ANGLE_OUT_OF_RANGE');
      expect(message.text).toBe('무릎을 더 펴세요');
      expect(message.speechText).toBe('무릎을 더 펴세요');
    });
  });
});
