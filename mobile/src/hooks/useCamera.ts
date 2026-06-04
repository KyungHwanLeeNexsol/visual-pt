// SPEC-UI-001: M1 카메라 스트림 + 권한 훅

import { useState, useCallback } from 'react';
import { Camera } from 'react-native-vision-camera';

export type CameraPermissionStatus = 'granted' | 'denied' | 'not-determined';

export interface UseCameraResult {
  hasPermission: boolean;
  isPermissionLoading: boolean;
  permissionStatus: CameraPermissionStatus;
  requestPermission: () => Promise<void>;
}

// @MX:ANCHOR: 카메라 권한 훅 — CameraScreen에서 참조
// @MX:REASON: CameraScreen, usePoseDetection에서 참조 (fan_in >= 2)
export function useCamera(): UseCameraResult {
  // VisionCamera v4: getCameraPermissionStatus()는 동기 API → 초기 상태 즉시 획득
  const [permissionStatus, setPermissionStatus] = useState<CameraPermissionStatus>(() => {
    try {
      return Camera.getCameraPermissionStatus() as CameraPermissionStatus;
    } catch {
      // 네이티브 모듈 없는 환경에서는 기본값 유지
      return 'not-determined';
    }
  });

  const requestPermission = useCallback(async () => {
    try {
      const status = await Camera.requestCameraPermission();
      setPermissionStatus(status as CameraPermissionStatus);
    } catch {
      setPermissionStatus('denied');
    }
  }, []);

  return {
    hasPermission: permissionStatus === 'granted',
    isPermissionLoading: false, // VisionCamera v4 동기 API — 로딩 대기 불필요
    permissionStatus,
    requestPermission,
  };
}
