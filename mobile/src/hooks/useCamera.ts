// SPEC-UI-001: M1 카메라 스트림 + 권한 훅

import { useState, useEffect, useCallback } from 'react';
import { Camera } from 'react-native-vision-camera';

export type CameraPermissionStatus = 'granted' | 'denied' | 'not-determined';

export interface UseCameraResult {
  hasPermission: boolean;
  permissionStatus: CameraPermissionStatus;
  requestPermission: () => Promise<void>;
}

// @MX:ANCHOR: 카메라 권한 훅 — CameraScreen에서 참조
// @MX:REASON: CameraScreen, usePoseDetection에서 참조 (fan_in >= 2)
export function useCamera(): UseCameraResult {
  const [permissionStatus, setPermissionStatus] =
    useState<CameraPermissionStatus>('not-determined');

  // 마운트 시 현재 권한 상태 조회
  useEffect(() => {
    let mounted = true;
    Camera.getCameraPermissionStatus()
      .then((status) => {
        if (mounted) {
          setPermissionStatus(status as CameraPermissionStatus);
        }
      })
      .catch(() => {
        // 네이티브 모듈 없는 환경에서는 기본값 유지
      });
    return () => {
      mounted = false;
    };
  }, []);

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
    permissionStatus,
    requestPermission,
  };
}
