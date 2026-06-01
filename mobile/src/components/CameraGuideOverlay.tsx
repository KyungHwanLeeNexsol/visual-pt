// SPEC-UI-001: M5 카메라 배치 가이드 오버레이

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export type AngleQuality = 'good' | 'warning' | 'poor';

interface Props {
  isVisible: boolean;
  angleQuality: AngleQuality;
  onDismiss?: () => void;
}

// AC-8: 카메라 배치 가이드 표시
// AC-9: 각도 품질 저하 시 재배치 경고 표시
export function CameraGuideOverlay({
  isVisible,
  angleQuality,
  onDismiss,
}: Props): React.JSX.Element | null {
  if (!isVisible) {
    return null;
  }

  const showWarning = angleQuality === 'poor' || angleQuality === 'warning';

  return (
    <View style={styles.container}>
      {/* AC-9: 각도 품질 경고 */}
      {showWarning && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>카메라 위치를 재배치하세요</Text>
        </View>
      )}

      {/* AC-8: 위치 안내 가이드 */}
      <View style={styles.guideCard}>
        <Text style={styles.guideTitle}>카메라 배치 안내</Text>
        <Text style={styles.guideText}>측면 45도, 골반 높이에서 촬영하세요</Text>
        <Text style={styles.guideSubText}>전신이 화면에 들어와야 합니다</Text>

        {onDismiss && (
          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Text style={styles.dismissText}>확인</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  warningBanner: {
    backgroundColor: 'rgba(255, 87, 34, 0.95)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  guideCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    alignItems: 'center',
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212121',
    marginBottom: 12,
  },
  guideText: {
    fontSize: 16,
    color: '#424242',
    marginBottom: 8,
    textAlign: 'center',
  },
  guideSubText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 16,
  },
  dismissButton: {
    backgroundColor: '#1976D2',
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 8,
  },
  dismissText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
