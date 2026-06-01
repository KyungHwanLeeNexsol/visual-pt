// SPEC-UI-001: expo-speech 테스트 모킹

const ExpoSpeech = {
  speak: jest.fn().mockResolvedValue(undefined),
  isSpeakingAsync: jest.fn().mockResolvedValue(false),
  stop: jest.fn().mockResolvedValue(undefined),
};

export default ExpoSpeech;
export const { speak, isSpeakingAsync, stop } = ExpoSpeech;
