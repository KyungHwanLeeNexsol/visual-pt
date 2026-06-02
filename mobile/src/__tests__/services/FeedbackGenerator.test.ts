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

    it('KNEE_ANGLE_OUT_OF_RANGE 에러 (60 < min 80) → 스쿼트 tooLow = "무릎을 더 구부리세요" 반환', () => {
      const error: FormError = {
        type: 'KNEE_ANGLE_OUT_OF_RANGE',
        joint: 'leftKnee',
        currentValue: 60,
        expectedRange: [80, 120],
        message: '무릎 각도가 범위를 벗어났습니다',
      };
      const messages = generator.generateMessages([error], 'squat');
      expect(messages).toHaveLength(1);
      expect(messages[0].text).toBe('무릎을 더 구부리세요');
      expect(messages[0].speechText).toBe('무릎을 더 구부리세요');
    });

    it('SPINE_MISALIGNMENT 에러 (deadlift) → "등을 편평하게 유지하세요" 텍스트 포함', () => {
      const error: FormError = {
        type: 'SPINE_MISALIGNMENT',
        joint: 'spine',
        currentValue: 140,
        expectedRange: [150, 180],
        message: '척추 정렬이 잘못되었습니다',
      };
      const messages = generator.generateMessages([error], 'deadlift');
      expect(messages).toHaveLength(1);
      expect(messages[0].text).toBe('등을 편평하게 유지하세요');
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

    it('HIP_ALIGNMENT 에러 (squat, 30 < min 45) → "엉덩이를 더 낮추세요" 텍스트 포함', () => {
      const error: FormError = {
        type: 'HIP_ALIGNMENT',
        joint: 'leftHip',
        currentValue: 30,
        expectedRange: [45, 135],
        message: '힙 정렬 오류',
      };
      const messages = generator.generateMessages([error], 'squat');
      expect(messages[0].text).toBe('엉덩이를 더 낮추세요');
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
    it('FormError 를 FeedbackMessage 로 변환한다 (60 < 80 → tooLow → 무릎을 더 구부리세요)', () => {
      const error: FormError = {
        type: 'KNEE_ANGLE_OUT_OF_RANGE',
        joint: 'leftKnee',
        currentValue: 60,
        expectedRange: [80, 120],
        message: '무릎 각도 오류',
      };
      const message = generator.errorToMessage(error);
      expect(message.errorType).toBe('KNEE_ANGLE_OUT_OF_RANGE');
      // errorToMessage 는 squat 기본값으로 동작, 60 < 80 → tooLow → 무릎을 더 구부리세요
      expect(message.text).toBe('무릎을 더 구부리세요');
      expect(message.speechText).toBe('무릎을 더 구부리세요');
    });
  });

  // E1: 방향성 + 운동별 맞춤 메시지 테스트
  describe('generateMessages - E1: 운동별 방향성 피드백', () => {
    describe('스쿼트 KNEE_ANGLE_OUT_OF_RANGE', () => {
      it('스쿼트 무릎 각도가 최솟값 미만 → "무릎을 더 구부리세요"', () => {
        // currentValue(60) < min(80) → tooLow
        const error: FormError = {
          type: 'KNEE_ANGLE_OUT_OF_RANGE',
          joint: 'leftKnee',
          currentValue: 60,
          expectedRange: [80, 120],
          message: '무릎 각도 오류',
        };
        const messages = generator.generateMessages([error], 'squat');
        expect(messages[0].text).toBe('무릎을 더 구부리세요');
        expect(messages[0].speechText).toBe('무릎을 더 구부리세요');
      });

      it('스쿼트 무릎 각도가 최댓값 초과 → "무릎을 더 펴세요"', () => {
        // currentValue(130) > max(120) → tooHigh
        const error: FormError = {
          type: 'KNEE_ANGLE_OUT_OF_RANGE',
          joint: 'leftKnee',
          currentValue: 130,
          expectedRange: [80, 120],
          message: '무릎 각도 오류',
        };
        const messages = generator.generateMessages([error], 'squat');
        expect(messages[0].text).toBe('무릎을 더 펴세요');
        expect(messages[0].speechText).toBe('무릎을 더 펴세요');
      });
    });

    describe('데드리프트 KNEE_ANGLE_OUT_OF_RANGE', () => {
      it('데드리프트 무릎 각도가 최솟값 미만 → "무릎을 살짝 굽히세요"', () => {
        // currentValue(80) < min(100) → tooLow
        const error: FormError = {
          type: 'KNEE_ANGLE_OUT_OF_RANGE',
          joint: 'leftKnee',
          currentValue: 80,
          expectedRange: [100, 160],
          message: '무릎 각도 오류',
        };
        const messages = generator.generateMessages([error], 'deadlift');
        expect(messages[0].text).toBe('무릎을 살짝 굽히세요');
      });

      it('데드리프트 무릎 각도가 최댓값 초과 → "무릎 각도를 유지하세요"', () => {
        // currentValue(170) > max(160) → tooHigh
        const error: FormError = {
          type: 'KNEE_ANGLE_OUT_OF_RANGE',
          joint: 'leftKnee',
          currentValue: 170,
          expectedRange: [100, 160],
          message: '무릎 각도 오류',
        };
        const messages = generator.generateMessages([error], 'deadlift');
        expect(messages[0].text).toBe('무릎 각도를 유지하세요');
      });
    });

    describe('SPINE_MISALIGNMENT 운동별 메시지', () => {
      it('스쿼트 척추 오류 → "척추를 중립으로 유지하세요"', () => {
        const error: FormError = {
          type: 'SPINE_MISALIGNMENT',
          joint: 'spine',
          currentValue: 140,
          expectedRange: [160, 180],
          message: '척추 오류',
        };
        const messages = generator.generateMessages([error], 'squat');
        expect(messages[0].text).toBe('척추를 중립으로 유지하세요');
      });

      it('데드리프트 척추 오류 → "등을 편평하게 유지하세요"', () => {
        const error: FormError = {
          type: 'SPINE_MISALIGNMENT',
          joint: 'spine',
          currentValue: 140,
          expectedRange: [150, 180],
          message: '척추 오류',
        };
        const messages = generator.generateMessages([error], 'deadlift');
        expect(messages[0].text).toBe('등을 편평하게 유지하세요');
      });
    });

    describe('HIP_ALIGNMENT 운동별 메시지', () => {
      it('스쿼트 힙 각도 최솟값 미만 → "엉덩이를 더 낮추세요"', () => {
        const error: FormError = {
          type: 'HIP_ALIGNMENT',
          joint: 'leftHip',
          currentValue: 30,
          expectedRange: [45, 135],
          message: '힙 오류',
        };
        const messages = generator.generateMessages([error], 'squat');
        expect(messages[0].text).toBe('엉덩이를 더 낮추세요');
      });

      it('스쿼트 힙 각도 최댓값 초과 → "엉덩이 위치를 조정하세요"', () => {
        const error: FormError = {
          type: 'HIP_ALIGNMENT',
          joint: 'leftHip',
          currentValue: 140,
          expectedRange: [45, 135],
          message: '힙 오류',
        };
        const messages = generator.generateMessages([error], 'squat');
        expect(messages[0].text).toBe('엉덩이 위치를 조정하세요');
      });

      it('데드리프트 힙 오류 → "엉덩이 힌지 동작을 확인하세요"', () => {
        const error: FormError = {
          type: 'HIP_ALIGNMENT',
          joint: 'leftHip',
          currentValue: 20,
          expectedRange: [30, 100],
          message: '힙 오류',
        };
        const messages = generator.generateMessages([error], 'deadlift');
        expect(messages[0].text).toBe('엉덩이 힌지 동작을 확인하세요');
      });
    });

    describe('SHOULDER_IMBALANCE 메시지', () => {
      it('스쿼트 어깨 불균형 → "어깨를 수평으로 유지하세요"', () => {
        const error: FormError = {
          type: 'SHOULDER_IMBALANCE',
          joint: 'leftShoulder',
          currentValue: 35,
          expectedRange: [0, 30],
          message: '어깨 오류',
        };
        const messages = generator.generateMessages([error], 'squat');
        expect(messages[0].text).toBe('어깨를 수평으로 유지하세요');
      });

      it('데드리프트 어깨 불균형 → "어깨를 수평으로 유지하세요"', () => {
        const error: FormError = {
          type: 'SHOULDER_IMBALANCE',
          joint: 'leftShoulder',
          currentValue: 35,
          expectedRange: [0, 30],
          message: '어깨 오류',
        };
        const messages = generator.generateMessages([error], 'deadlift');
        expect(messages[0].text).toBe('어깨를 수평으로 유지하세요');
      });
    });

    describe('TORSO_ANGLE_OUT_OF_RANGE 메시지 (데드리프트 전용)', () => {
      it('데드리프트 torso 각도 최솟값 미만 → "몸통을 더 세우세요"', () => {
        const error: FormError = {
          type: 'TORSO_ANGLE_OUT_OF_RANGE',
          joint: 'torso',
          currentValue: 20,
          expectedRange: [30, 80],
          message: '몸통 각도 오류',
        };
        const messages = generator.generateMessages([error], 'deadlift');
        expect(messages[0].text).toBe('몸통을 더 세우세요');
        expect(messages[0].speechText).toBe('몸통을 더 세우세요');
      });

      it('데드리프트 torso 각도 최댓값 초과 → "상체를 더 숙이세요"', () => {
        const error: FormError = {
          type: 'TORSO_ANGLE_OUT_OF_RANGE',
          joint: 'torso',
          currentValue: 90,
          expectedRange: [30, 80],
          message: '몸통 각도 오류',
        };
        const messages = generator.generateMessages([error], 'deadlift');
        expect(messages[0].text).toBe('상체를 더 숙이세요');
      });
    });

    describe('폴백: 알 수 없는 방향 처리', () => {
      it('currentValue 가 범위 내에 있어도 에러가 들어오면 general 메시지를 반환한다', () => {
        // currentValue 가 범위 내이지만 에러가 전달된 경우 → 안전하게 처리
        const error: FormError = {
          type: 'SPINE_MISALIGNMENT',
          joint: 'spine',
          currentValue: 165,
          expectedRange: [160, 180],
          message: '척추 오류',
        };
        const messages = generator.generateMessages([error], 'squat');
        // 최소한 메시지가 반환되어야 한다
        expect(messages).toHaveLength(1);
        expect(typeof messages[0].text).toBe('string');
        expect(messages[0].text.length).toBeGreaterThan(0);
      });
    });
  });
});
