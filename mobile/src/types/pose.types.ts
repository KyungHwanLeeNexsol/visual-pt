// SPEC-UI-001: M1 포즈 추정 타입 계약

// MediaPipe 키포인트 (33개 랜드마크)
export interface Keypoint {
  x: number;          // 정규화 좌표 [0,1]
  y: number;          // 정규화 좌표 [0,1]
  z: number;          // 깊이 (2D에서는 0)
  visibility: number; // 신뢰도 [0,1]
}

// MediaPipe 랜드마크 인덱스 (0-32)
export enum LandmarkIndex {
  NOSE = 0,
  LEFT_EYE_INNER = 1,
  LEFT_EYE = 2,
  LEFT_EYE_OUTER = 3,
  RIGHT_EYE_INNER = 4,
  RIGHT_EYE = 5,
  RIGHT_EYE_OUTER = 6,
  LEFT_EAR = 7,
  RIGHT_EAR = 8,
  MOUTH_LEFT = 9,
  MOUTH_RIGHT = 10,
  LEFT_SHOULDER = 11,
  RIGHT_SHOULDER = 12,
  LEFT_ELBOW = 13,
  RIGHT_ELBOW = 14,
  LEFT_WRIST = 15,
  RIGHT_WRIST = 16,
  LEFT_PINKY = 17,
  RIGHT_PINKY = 18,
  LEFT_INDEX = 19,
  RIGHT_INDEX = 20,
  LEFT_THUMB = 21,
  RIGHT_THUMB = 22,
  LEFT_HIP = 23,
  RIGHT_HIP = 24,
  LEFT_KNEE = 25,
  RIGHT_KNEE = 26,
  LEFT_ANKLE = 27,
  RIGHT_ANKLE = 28,
  LEFT_HEEL = 29,
  RIGHT_HEEL = 30,
  LEFT_FOOT_INDEX = 31,
  RIGHT_FOOT_INDEX = 32,
}

export interface PoseResult {
  landmarks: Keypoint[]; // 33개 랜드마크
  timestamp: number;     // ms
}

export interface JointAngles {
  leftKnee?: number;
  rightKnee?: number;
  leftHip?: number;
  rightHip?: number;
  spine?: number;
  leftShoulder?: number;
  rightShoulder?: number;
  // 데드리프트 전용: 몸통(어깨-힙 벡터)과 수직 축 사이의 각도 (도)
  // 스쿼트에서는 undefined, 데드리프트 바닥 자세 정상 범위: 30-45도
  torsoAngle?: number;
}

export type ExerciseType = 'squat' | 'deadlift';
