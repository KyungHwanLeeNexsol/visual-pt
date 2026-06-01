// SPEC-UI-001: useCamera 훅 단위 테스트 (Phase C)

// react-native-vision-camera 네이티브 모듈 mock
jest.mock(
  'react-native-vision-camera',
  () => ({
    Camera: {
      getCameraPermissionStatus: jest.fn().mockResolvedValue('not-determined'),
      requestCameraPermission: jest.fn().mockResolvedValue('granted'),
    },
    useCameraDevice: jest.fn().mockReturnValue({ id: 'back', position: 'back' }),
  }),
  { virtual: true },
);

import { renderHook, act } from '@testing-library/react-native';
import { Camera } from 'react-native-vision-camera';
import { useCamera } from '../../hooks/useCamera';

const mockCamera = Camera as jest.Mocked<typeof Camera>;

describe('useCamera', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 기본: not-determined 상태
    mockCamera.getCameraPermissionStatus = jest.fn().mockResolvedValue('not-determined');
    mockCamera.requestCameraPermission = jest.fn().mockResolvedValue('granted');
  });

  it('초기 상태에서 hasPermission은 false이다 (not-determined)', async () => {
    const { result } = renderHook(() => useCamera());

    // 비동기 초기화 완료 대기
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.hasPermission).toBe(false);
    expect(result.current.permissionStatus).toBe('not-determined');
  });

  it('requestPermission() 호출 후 granted 시 hasPermission이 true가 된다', async () => {
    mockCamera.requestCameraPermission = jest.fn().mockResolvedValue('granted');

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(result.current.hasPermission).toBe(true);
    expect(result.current.permissionStatus).toBe('granted');
  });

  it('상태가 denied일 때 hasPermission은 false이다', async () => {
    mockCamera.getCameraPermissionStatus = jest.fn().mockResolvedValue('denied');

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.hasPermission).toBe(false);
    expect(result.current.permissionStatus).toBe('denied');
  });

  it('requestPermission() 이 denied를 반환하면 hasPermission은 false이다', async () => {
    mockCamera.requestCameraPermission = jest.fn().mockResolvedValue('denied');

    const { result } = renderHook(() => useCamera());

    await act(async () => {
      await result.current.requestPermission();
    });

    expect(result.current.hasPermission).toBe(false);
  });
});
