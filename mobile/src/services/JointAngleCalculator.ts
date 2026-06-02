// SPEC-UI-001: M2 관절 각도 계산 서비스

import type { Keypoint, JointAngles, ExerciseType } from '../types/pose.types';
import { LandmarkIndex } from '../types/pose.types';
import type { FormError } from '../types/feedback.types';
import { calculateAngle } from '../utils/mathHelpers';
import { VISIBILITY_THRESHOLD, POSE_CONFIG } from '../config/pose.config';
import { FEEDBACK_MESSAGES } from '../config/feedback.config';

// @MX:ANCHOR: 관절 각도 계산의 핵심 서비스 — 포즈 파이프라인의 중심
// @MX:REASON: PoseEstimationService, FeedbackGenerator 에서 참조 (fan_in >= 3)
export class JointAngleCalculator {
  /**
   * 33개 MediaPipe 랜드마크에서 관절 각도를 계산한다.
   * VISIBILITY_THRESHOLD 미만인 키포인트는 계산에서 제외하며
   * 해당 각도는 undefined 를 반환한다.
   */
  calculateAngles(landmarks: Keypoint[], exercise: ExerciseType): JointAngles {
    const angles: JointAngles = {};

    // 왼쪽 무릎: LEFT_HIP - LEFT_KNEE - LEFT_ANKLE
    angles.leftKnee = this.safeAngle(
      landmarks,
      LandmarkIndex.LEFT_HIP,
      LandmarkIndex.LEFT_KNEE,
      LandmarkIndex.LEFT_ANKLE,
    );

    // 오른쪽 무릎: RIGHT_HIP - RIGHT_KNEE - RIGHT_ANKLE
    angles.rightKnee = this.safeAngle(
      landmarks,
      LandmarkIndex.RIGHT_HIP,
      LandmarkIndex.RIGHT_KNEE,
      LandmarkIndex.RIGHT_ANKLE,
    );

    // 왼쪽 엉덩이: LEFT_SHOULDER - LEFT_HIP - LEFT_KNEE
    angles.leftHip = this.safeAngle(
      landmarks,
      LandmarkIndex.LEFT_SHOULDER,
      LandmarkIndex.LEFT_HIP,
      LandmarkIndex.LEFT_KNEE,
    );

    // 오른쪽 엉덩이: RIGHT_SHOULDER - RIGHT_HIP - RIGHT_KNEE
    angles.rightHip = this.safeAngle(
      landmarks,
      LandmarkIndex.RIGHT_SHOULDER,
      LandmarkIndex.RIGHT_HIP,
      LandmarkIndex.RIGHT_KNEE,
    );

    // 척추: LEFT_SHOULDER - LEFT_HIP - LEFT_ANKLE (척추 정렬 근사)
    angles.spine = this.safeAngle(
      landmarks,
      LandmarkIndex.LEFT_SHOULDER,
      LandmarkIndex.LEFT_HIP,
      LandmarkIndex.LEFT_ANKLE,
    );

    // 어깨 수평: LEFT_SHOULDER 와 RIGHT_SHOULDER 의 y 좌표 차이 기반 각도
    angles.leftShoulder = this.shoulderLevelAngle(landmarks);
    angles.rightShoulder = angles.leftShoulder;

    // 데드리프트 전용: 몸통 각도(수직 축 대비 어깨-힙 벡터 기울기) 계산
    if (exercise === 'deadlift') {
      angles.torsoAngle = this.torsoVerticalAngle(landmarks);
    }
    // 스쿼트는 torsoAngle 불필요 (undefined 유지)

    return angles;
  }

  /**
   * 키포인트의 visibility 가 임계값 이상인지 확인한다.
   */
  isVisible(keypoint: Keypoint): boolean {
    return keypoint.visibility >= VISIBILITY_THRESHOLD;
  }

  /**
   * 계산된 각도와 운동 설정을 기반으로 폼 오류를 감지한다.
   */
  detectErrors(angles: JointAngles, exercise: ExerciseType): FormError[] {
    const errors: FormError[] = [];
    const config = POSE_CONFIG[exercise];

    // 무릎 각도 검사
    if ('kneeAngle' in config) {
      const { min, max } = config.kneeAngle;

      if (angles.leftKnee !== undefined && (angles.leftKnee < min || angles.leftKnee > max)) {
        errors.push({
          type: 'KNEE_ANGLE_OUT_OF_RANGE',
          joint: 'leftKnee',
          currentValue: angles.leftKnee,
          expectedRange: [min, max],
          message: FEEDBACK_MESSAGES.KNEE_ANGLE_OUT_OF_RANGE.text,
        });
      }

      if (angles.rightKnee !== undefined && (angles.rightKnee < min || angles.rightKnee > max)) {
        errors.push({
          type: 'KNEE_ANGLE_OUT_OF_RANGE',
          joint: 'rightKnee',
          currentValue: angles.rightKnee,
          expectedRange: [min, max],
          message: FEEDBACK_MESSAGES.KNEE_ANGLE_OUT_OF_RANGE.text,
        });
      }
    }

    // 척추 각도 검사
    if ('spineAngle' in config) {
      const { min, max } = config.spineAngle;

      if (angles.spine !== undefined && (angles.spine < min || angles.spine > max)) {
        errors.push({
          type: 'SPINE_MISALIGNMENT',
          joint: 'spine',
          currentValue: angles.spine,
          expectedRange: [min, max],
          message: FEEDBACK_MESSAGES.SPINE_MISALIGNMENT.text,
        });
      }
    }

    // 엉덩이 각도 검사
    if ('hipAngle' in config) {
      const { min, max } = config.hipAngle;

      if (angles.leftHip !== undefined && (angles.leftHip < min || angles.leftHip > max)) {
        errors.push({
          type: 'HIP_ALIGNMENT',
          joint: 'leftHip',
          currentValue: angles.leftHip,
          expectedRange: [min, max],
          message: FEEDBACK_MESSAGES.HIP_ALIGNMENT.text,
        });
      }

      if (angles.rightHip !== undefined && (angles.rightHip < min || angles.rightHip > max)) {
        errors.push({
          type: 'HIP_ALIGNMENT',
          joint: 'rightHip',
          currentValue: angles.rightHip,
          expectedRange: [min, max],
          message: FEEDBACK_MESSAGES.HIP_ALIGNMENT.text,
        });
      }
    }

    // 어깨 수평 검사
    if ('shoulderAngle' in config) {
      const { min, max } = config.shoulderAngle;

      if (
        angles.leftShoulder !== undefined &&
        (angles.leftShoulder < min || angles.leftShoulder > max)
      ) {
        errors.push({
          type: 'SHOULDER_IMBALANCE',
          joint: 'leftShoulder',
          currentValue: angles.leftShoulder,
          expectedRange: [min, max],
          message: FEEDBACK_MESSAGES.SHOULDER_IMBALANCE.text,
        });
      }
    }

    // 데드리프트 몸통 각도 검사 (Phase C: torsoAngle 플레이스홀더 해소)
    if ('torsoAngle' in config && angles.torsoAngle !== undefined) {
      const { min, max } = config.torsoAngle;

      if (angles.torsoAngle < min || angles.torsoAngle > max) {
        errors.push({
          type: 'TORSO_ANGLE_OUT_OF_RANGE',
          joint: 'torso',
          currentValue: angles.torsoAngle,
          expectedRange: [min, max],
          message: FEEDBACK_MESSAGES.TORSO_ANGLE_OUT_OF_RANGE.text,
        });
      }
    }

    return errors;
  }

  // 세 키포인트가 모두 가시적인 경우에만 각도를 계산하는 헬퍼
  private safeAngle(
    landmarks: Keypoint[],
    aIdx: number,
    bIdx: number,
    cIdx: number,
  ): number | undefined {
    const a = landmarks[aIdx];
    const b = landmarks[bIdx];
    const c = landmarks[cIdx];

    if (!a || !b || !c) return undefined;
    if (!this.isVisible(a) || !this.isVisible(b) || !this.isVisible(c)) return undefined;

    return calculateAngle(
      { x: a.x, y: a.y },
      { x: b.x, y: b.y },
      { x: c.x, y: c.y },
    );
  }

  // 어깨 수평 각도: 두 어깨의 y 좌표 차이를 각도로 변환
  private shoulderLevelAngle(landmarks: Keypoint[]): number | undefined {
    const leftShoulder = landmarks[LandmarkIndex.LEFT_SHOULDER];
    const rightShoulder = landmarks[LandmarkIndex.RIGHT_SHOULDER];

    if (!leftShoulder || !rightShoulder) return undefined;
    if (!this.isVisible(leftShoulder) || !this.isVisible(rightShoulder)) return undefined;

    const dx = rightShoulder.x - leftShoulder.x;
    const dy = rightShoulder.y - leftShoulder.y;
    const angleRad = Math.atan2(Math.abs(dy), Math.abs(dx));
    return (angleRad * 180) / Math.PI;
  }

  // 데드리프트 전용: 몸통(LEFT_SHOULDER → LEFT_HIP 벡터)과 수직 축(0,1)의 각도 계산
  // 수직에 가까울수록 0도, 90도 기울어지면 90도
  private torsoVerticalAngle(landmarks: Keypoint[]): number | undefined {
    const shoulder = landmarks[LandmarkIndex.LEFT_SHOULDER];
    const hip = landmarks[LandmarkIndex.LEFT_HIP];

    if (!shoulder || !hip) return undefined;
    if (!this.isVisible(shoulder) || !this.isVisible(hip)) return undefined;

    // 몸통 벡터: 힙에서 어깨 방향 (위쪽이 양의 y 감소 방향)
    const dx = shoulder.x - hip.x;
    const dy = shoulder.y - hip.y; // 정규화 좌표에서 위쪽 = y 감소

    // 수직 축 (0, -1) 과의 각도: atan2(|dx|, |dy|)
    // dy 가 음수(어깨가 힙보다 위)일 때 수직에 가까움
    const angleRad = Math.atan2(Math.abs(dx), Math.abs(dy));
    return (angleRad * 180) / Math.PI;
  }
}
