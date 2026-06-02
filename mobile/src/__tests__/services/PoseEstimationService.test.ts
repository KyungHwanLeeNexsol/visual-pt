// SPEC-UI-001: PoseEstimationService 단위 테스트 (Phase C)

// react-native-mediapipe 네이티브 모듈 mock
jest.mock(
  'react-native-mediapipe',
  () => ({
    usePoseLandmarker: jest.fn(() => ({
      detect: jest.fn(),
      isModelLoaded: false,
    })),
    PoseLandmarker: {
      createFromOptions: jest.fn().mockResolvedValue({}),
      close: jest.fn().mockResolvedValue(undefined),
    },
  }),
  { virtual: true },
);

import { PoseEstimationService } from '../../services/PoseEstimationService';

describe('PoseEstimationService', () => {
  let service: PoseEstimationService;

  beforeEach(() => {
    service = new PoseEstimationService();
    jest.clearAllMocks();
  });

  describe('isInitialized()', () => {
    it('initialize() 호출 전에는 false를 반환한다', () => {
      expect(service.isInitialized()).toBe(false);
    });
  });

  describe('initialize()', () => {
    it('초기화 성공 후 isInitialized()가 true를 반환한다', async () => {
      await service.initialize('squat');
      expect(service.isInitialized()).toBe(true);
    });

    it('이미 초기화된 상태에서 다시 호출해도 에러 없이 처리된다', async () => {
      await service.initialize('squat');
      await expect(service.initialize('deadlift')).resolves.not.toThrow();
      // 재초기화 후에도 isInitialized는 true
      expect(service.isInitialized()).toBe(true);
    });

    it('다른 운동 타입으로 초기화할 수 있다', async () => {
      await service.initialize('deadlift');
      expect(service.isInitialized()).toBe(true);
    });
  });

  describe('destroy()', () => {
    it('destroy() 호출 후 isInitialized()가 false를 반환한다', async () => {
      await service.initialize('squat');
      expect(service.isInitialized()).toBe(true);

      await service.destroy();
      expect(service.isInitialized()).toBe(false);
    });

    it('초기화되지 않은 상태에서 destroy() 를 호출해도 에러가 없다', async () => {
      await expect(service.destroy()).resolves.not.toThrow();
    });
  });
});
