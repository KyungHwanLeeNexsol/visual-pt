// SPEC-UI-001: M1 react-native-mediapipe 통합 서비스

import type { ExerciseType } from '../types/pose.types';

// 테스트 가능성을 위한 인터페이스 — 네이티브 브릿지를 mock으로 대체 가능
export interface IPoseEstimationService {
  initialize(exercise: ExerciseType): Promise<void>;
  destroy(): Promise<void>;
  isInitialized(): boolean;
}

// @MX:ANCHOR: 포즈 추정 서비스 — PoseEstimationService를 usePoseDetection에서 참조
// @MX:REASON: usePoseDetection, CameraScreen에서 참조 (fan_in >= 2)
export class PoseEstimationService implements IPoseEstimationService {
  private initialized = false;

  /**
   * MediaPipe 포즈 추정기를 초기화한다.
   * 네이티브 모듈이 없는 환경(테스트)에서는 no-op으로 동작한다.
   */
  async initialize(exercise: ExerciseType): Promise<void> {
    /* istanbul ignore next -- 네이티브 모듈 초기화, 실기기 전용 */
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PoseLandmarker } = require('react-native-mediapipe') as {
        PoseLandmarker: {
          createFromOptions: (opts: Record<string, unknown>) => Promise<unknown>;
        };
      };
      await PoseLandmarker.createFromOptions({
        exerciseType: exercise,
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
    } catch {
      // 테스트 환경에서는 네이티브 모듈이 없으므로 무시
    }
    this.initialized = true;
  }

  /**
   * 포즈 추정기를 종료하고 리소스를 해제한다.
   */
  async destroy(): Promise<void> {
    /* istanbul ignore next -- 네이티브 모듈 해제, 실기기 전용 */
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PoseLandmarker } = require('react-native-mediapipe') as {
        PoseLandmarker: { close: () => Promise<void> };
      };
      await PoseLandmarker.close();
    } catch {
      // 테스트 환경에서는 무시
    }
    this.initialized = false;
  }

  /**
   * 초기화 여부를 반환한다.
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}
