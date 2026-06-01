// SPEC-UI-001: JointAngleCalculator 단위 테스트 (AC-2, AC-3, AC-4)

import { JointAngleCalculator } from '../../services/JointAngleCalculator';
import type { Keypoint } from '../../types/pose.types';
import { LandmarkIndex } from '../../types/pose.types';

// 33개의 기본 랜드마크 생성 헬퍼 (모든 visibility=1.0)
function makeLandmarks(overrides: Partial<Record<number, Partial<Keypoint>>> = {}): Keypoint[] {
  const landmarks: Keypoint[] = Array.from({ length: 33 }, (_, i) => ({
    x: 0.5,
    y: 0.5 + i * 0.01,
    z: 0,
    visibility: 1.0,
  }));
  for (const [idx, override] of Object.entries(overrides)) {
    landmarks[Number(idx)] = { ...landmarks[Number(idx)], ...override };
  }
  return landmarks;
}

// 스쿼트 자세: 무릎 각도가 실제로 계산 가능한 좌표 설정
// LEFT_HIP(23) - LEFT_KNEE(25) - LEFT_ANKLE(27) 로 각도 측정
function makeSquatLandmarksWithKneeAngle(desiredKneeDegrees: number): Keypoint[] {
  // B = LEFT_KNEE (0,0), A = LEFT_HIP (0, 1), C = 원하는 각도 방향으로 배치
  const landmarks = makeLandmarks();
  const rad = (desiredKneeDegrees * Math.PI) / 180;
  // A at (0, 1) - B at (0, 0) - C at (sin(π - rad), -cos(π - rad))
  // 벡터 BA = (0,1), 벡터 BC = (sin(rad), -cos(rad))
  // 이 둘 사이의 각도 = desiredKneeDegrees
  landmarks[LandmarkIndex.LEFT_HIP] = { x: 0.5, y: 0.0, z: 0, visibility: 1.0 };
  landmarks[LandmarkIndex.LEFT_KNEE] = { x: 0.5, y: 0.3, z: 0, visibility: 1.0 };
  const sinA = Math.sin(rad);
  const cosA = Math.cos(rad);
  landmarks[LandmarkIndex.LEFT_ANKLE] = {
    x: 0.5 + sinA * 0.3,
    y: 0.3 + cosA * 0.3,
    z: 0,
    visibility: 1.0,
  };
  // RIGHT side 동일하게 설정
  landmarks[LandmarkIndex.RIGHT_HIP] = { x: 0.6, y: 0.0, z: 0, visibility: 1.0 };
  landmarks[LandmarkIndex.RIGHT_KNEE] = { x: 0.6, y: 0.3, z: 0, visibility: 1.0 };
  landmarks[LandmarkIndex.RIGHT_ANKLE] = {
    x: 0.6 + sinA * 0.3,
    y: 0.3 + cosA * 0.3,
    z: 0,
    visibility: 1.0,
  };
  return landmarks;
}

describe('JointAngleCalculator', () => {
  let calculator: JointAngleCalculator;

  beforeEach(() => {
    calculator = new JointAngleCalculator();
  });

  describe('isVisible', () => {
    it('visibility >= 0.5 이면 true를 반환한다', () => {
      const kp: Keypoint = { x: 0.5, y: 0.5, z: 0, visibility: 0.5 };
      expect(calculator.isVisible(kp)).toBe(true);
    });

    it('visibility < 0.5 이면 false를 반환한다', () => {
      const kp: Keypoint = { x: 0.5, y: 0.5, z: 0, visibility: 0.49 };
      expect(calculator.isVisible(kp)).toBe(false);
    });

    it('visibility = 0 이면 false를 반환한다', () => {
      const kp: Keypoint = { x: 0.5, y: 0.5, z: 0, visibility: 0 };
      expect(calculator.isVisible(kp)).toBe(false);
    });

    it('visibility = 1.0 이면 true를 반환한다', () => {
      const kp: Keypoint = { x: 0.5, y: 0.5, z: 0, visibility: 1.0 };
      expect(calculator.isVisible(kp)).toBe(true);
    });
  });

  describe('calculateAngles - AC-2: 낮은 visibility 키포인트 제외', () => {
    it('모든 키포인트 visibility >= 0.5 이면 무릎 각도가 계산된다', () => {
      const landmarks = makeSquatLandmarksWithKneeAngle(90);
      const angles = calculator.calculateAngles(landmarks, 'squat');
      expect(angles.leftKnee).toBeDefined();
      expect(angles.rightKnee).toBeDefined();
    });

    it('AC-2: LEFT_KNEE visibility < 0.5 이면 leftKnee 각도는 undefined이다', () => {
      const landmarks = makeSquatLandmarksWithKneeAngle(90);
      landmarks[LandmarkIndex.LEFT_KNEE] = { ...landmarks[LandmarkIndex.LEFT_KNEE], visibility: 0.3 };
      const angles = calculator.calculateAngles(landmarks, 'squat');
      expect(angles.leftKnee).toBeUndefined();
    });

    it('AC-2: LEFT_HIP visibility < 0.5 이면 leftKnee 각도는 undefined이다', () => {
      const landmarks = makeSquatLandmarksWithKneeAngle(90);
      landmarks[LandmarkIndex.LEFT_HIP] = { ...landmarks[LandmarkIndex.LEFT_HIP], visibility: 0.2 };
      const angles = calculator.calculateAngles(landmarks, 'squat');
      expect(angles.leftKnee).toBeUndefined();
    });

    it('AC-2: LEFT_ANKLE visibility < 0.5 이면 leftKnee 각도는 undefined이다', () => {
      const landmarks = makeSquatLandmarksWithKneeAngle(90);
      landmarks[LandmarkIndex.LEFT_ANKLE] = { ...landmarks[LandmarkIndex.LEFT_ANKLE], visibility: 0.1 };
      const angles = calculator.calculateAngles(landmarks, 'squat');
      expect(angles.leftKnee).toBeUndefined();
    });

    it('RIGHT_KNEE visibility < 0.5 이면 rightKnee는 undefined이지만 leftKnee는 정상 계산된다', () => {
      const landmarks = makeSquatLandmarksWithKneeAngle(100);
      landmarks[LandmarkIndex.RIGHT_KNEE] = { ...landmarks[LandmarkIndex.RIGHT_KNEE], visibility: 0.1 };
      const angles = calculator.calculateAngles(landmarks, 'squat');
      expect(angles.rightKnee).toBeUndefined();
      expect(angles.leftKnee).toBeDefined();
    });
  });

  describe('detectErrors - AC-3: 스쿼트 무릎 각도 경계값 테스트', () => {
    it('AC-3: 스쿼트 무릎 = 60도 (80-120 범위 외) → KNEE_ANGLE_OUT_OF_RANGE 에러', () => {
      const angles = { leftKnee: 60, rightKnee: 100 };
      const errors = calculator.detectErrors(angles, 'squat');
      expect(errors.some((e) => e.type === 'KNEE_ANGLE_OUT_OF_RANGE')).toBe(true);
    });

    it('AC-3: 스쿼트 무릎 = 79도 (경계 하한 이하) → KNEE_ANGLE_OUT_OF_RANGE 에러', () => {
      const angles = { leftKnee: 79, rightKnee: 100 };
      const errors = calculator.detectErrors(angles, 'squat');
      expect(errors.some((e) => e.type === 'KNEE_ANGLE_OUT_OF_RANGE')).toBe(true);
    });

    it('AC-3: 스쿼트 무릎 = 80도 (경계 하한 포함) → 에러 없음', () => {
      const angles = { leftKnee: 80, rightKnee: 100 };
      const errors = calculator.detectErrors(angles, 'squat');
      const kneeErrors = errors.filter((e) => e.type === 'KNEE_ANGLE_OUT_OF_RANGE' && e.joint === 'leftKnee');
      expect(kneeErrors).toHaveLength(0);
    });

    it('AC-3: 스쿼트 무릎 = 120도 (경계 상한 포함) → 에러 없음', () => {
      const angles = { leftKnee: 100, rightKnee: 120 };
      const errors = calculator.detectErrors(angles, 'squat');
      const kneeErrors = errors.filter((e) => e.type === 'KNEE_ANGLE_OUT_OF_RANGE' && e.joint === 'rightKnee');
      expect(kneeErrors).toHaveLength(0);
    });

    it('AC-3: 스쿼트 무릎 = 121도 (경계 상한 초과) → KNEE_ANGLE_OUT_OF_RANGE 에러', () => {
      const angles = { leftKnee: 100, rightKnee: 121 };
      const errors = calculator.detectErrors(angles, 'squat');
      expect(errors.some((e) => e.type === 'KNEE_ANGLE_OUT_OF_RANGE' && e.joint === 'rightKnee')).toBe(true);
    });

    it('양쪽 무릎이 모두 정상이면 무릎 에러 없음', () => {
      const angles = { leftKnee: 90, rightKnee: 95 };
      const errors = calculator.detectErrors(angles, 'squat');
      expect(errors.filter((e) => e.type === 'KNEE_ANGLE_OUT_OF_RANGE')).toHaveLength(0);
    });

    it('무릎 각도가 undefined이면 KNEE_ANGLE_OUT_OF_RANGE 에러를 생성하지 않는다', () => {
      const angles = { leftKnee: undefined, rightKnee: 90 };
      const errors = calculator.detectErrors(angles, 'squat');
      const leftKneeErrors = errors.filter(
        (e) => e.type === 'KNEE_ANGLE_OUT_OF_RANGE' && e.joint === 'leftKnee',
      );
      expect(leftKneeErrors).toHaveLength(0);
    });
  });

  describe('detectErrors - AC-4: 데드리프트 척추 정렬', () => {
    it('AC-4: 데드리프트 척추 = 140도 (150-180 범위 외) → SPINE_MISALIGNMENT 에러', () => {
      const angles = { spine: 140 };
      const errors = calculator.detectErrors(angles, 'deadlift');
      expect(errors.some((e) => e.type === 'SPINE_MISALIGNMENT')).toBe(true);
    });

    it('데드리프트 척추 = 160도 (범위 내) → SPINE_MISALIGNMENT 에러 없음', () => {
      const angles = { spine: 160 };
      const errors = calculator.detectErrors(angles, 'deadlift');
      expect(errors.filter((e) => e.type === 'SPINE_MISALIGNMENT')).toHaveLength(0);
    });

    it('데드리프트 척추 = 149도 → SPINE_MISALIGNMENT 에러', () => {
      const angles = { spine: 149 };
      const errors = calculator.detectErrors(angles, 'deadlift');
      expect(errors.some((e) => e.type === 'SPINE_MISALIGNMENT')).toBe(true);
    });

    it('FormError 에는 currentValue, expectedRange, message 가 포함된다', () => {
      const angles = { leftKnee: 60 };
      const errors = calculator.detectErrors(angles, 'squat');
      const err = errors.find((e) => e.type === 'KNEE_ANGLE_OUT_OF_RANGE');
      expect(err).toBeDefined();
      expect(err?.currentValue).toBe(60);
      expect(err?.expectedRange).toEqual([80, 120]);
      expect(typeof err?.message).toBe('string');
      expect(err?.message.length).toBeGreaterThan(0);
    });
  });

  describe('detectErrors - 엉덩이/어깨 에러 감지', () => {
    it('스쿼트 leftHip 범위 초과 → HIP_ALIGNMENT 에러', () => {
      // squat hipAngle: { min: 45, max: 135 }
      const angles = { leftHip: 30 }; // 45 미만
      const errors = calculator.detectErrors(angles, 'squat');
      expect(errors.some((e) => e.type === 'HIP_ALIGNMENT' && e.joint === 'leftHip')).toBe(true);
    });

    it('스쿼트 rightHip 범위 초과 → HIP_ALIGNMENT 에러', () => {
      const angles = { rightHip: 140 }; // 135 초과
      const errors = calculator.detectErrors(angles, 'squat');
      expect(errors.some((e) => e.type === 'HIP_ALIGNMENT' && e.joint === 'rightHip')).toBe(true);
    });

    it('스쿼트 어깨 불균형 → SHOULDER_IMBALANCE 에러', () => {
      // squat shoulderAngle: { min: 0, max: 30 }
      const angles = { leftShoulder: 35 }; // 30 초과
      const errors = calculator.detectErrors(angles, 'squat');
      expect(errors.some((e) => e.type === 'SHOULDER_IMBALANCE' && e.joint === 'leftShoulder')).toBe(true);
    });

    it('엉덩이/어깨 각도가 undefined이면 에러 없음', () => {
      const angles = { leftHip: undefined, rightHip: undefined, leftShoulder: undefined };
      const errors = calculator.detectErrors(angles, 'squat');
      expect(errors.filter((e) => e.type === 'HIP_ALIGNMENT' || e.type === 'SHOULDER_IMBALANCE')).toHaveLength(0);
    });
  });

  describe('calculateAngles - 랜드마크 null 경계 케이스', () => {
    it('랜드마크 배열이 33개 미만이면 undefined 각도를 반환한다', () => {
      // 빈 배열 → 모든 인덱스 접근 시 undefined
      const emptyLandmarks: Keypoint[] = [];
      const angles = calculator.calculateAngles(emptyLandmarks, 'squat');
      expect(angles.leftKnee).toBeUndefined();
      expect(angles.rightKnee).toBeUndefined();
      expect(angles.leftHip).toBeUndefined();
    });

    it('어깨 랜드마크가 없으면 shoulderLevelAngle 은 undefined이다', () => {
      const landmarks = makeLandmarks();
      // LEFT_SHOULDER, RIGHT_SHOULDER 를 visibility=0 으로 설정
      landmarks[LandmarkIndex.LEFT_SHOULDER] = { ...landmarks[LandmarkIndex.LEFT_SHOULDER], visibility: 0 };
      const angles = calculator.calculateAngles(landmarks, 'squat');
      expect(angles.leftShoulder).toBeUndefined();
    });
  });
});
