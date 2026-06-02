// react-native-mediapipe 테스트 환경 mock
// 실기기 전용 네이티브 모듈을 Jest 환경에서 대체

export const usePoseLandmarker = jest.fn(() => ({
  detect: jest.fn(),
  isModelLoaded: false,
}));

// NormalizedLandmark 타입 mock — 타입 임포트용
export type NormalizedLandmark = {
  x: number;
  y: number;
  z: number;
  visibility?: number;
};
