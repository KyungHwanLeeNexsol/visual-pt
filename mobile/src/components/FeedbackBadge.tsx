// SPEC-UI-001: M3 텍스트 피드백 배지 UI

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { FeedbackMessage } from '../types/feedback.types';

interface Props {
  message: FeedbackMessage | null;
  visible: boolean;
}

// AC-5: 텍스트 피드백 메시지 표시 컴포넌트
export function FeedbackBadge({ message, visible }: Props): React.JSX.Element | null {
  if (!visible || message === null) {
    return null;
  }

  const isError = message.severity === 'error';

  return (
    <View style={[styles.container, isError ? styles.errorBg : styles.warningBg]}>
      <Text style={styles.text}>{message.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'center',
  },
  warningBg: {
    backgroundColor: 'rgba(255, 193, 7, 0.9)',
  },
  errorBg: {
    backgroundColor: 'rgba(244, 67, 54, 0.9)',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
