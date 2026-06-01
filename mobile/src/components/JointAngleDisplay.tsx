// SPEC-UI-001: M2 관절 각도 디버그/표시 컴포넌트

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { JointAngles } from '../types/pose.types';

interface Props {
  angles: JointAngles | null;
  visible?: boolean;
}

export function JointAngleDisplay({
  angles,
  visible = true,
}: Props): React.JSX.Element | null {
  if (!visible || angles === null) {
    return null;
  }

  const formatAngle = (value: number | undefined): string => {
    if (value === undefined) return '-';
    return `${value.toFixed(1)}°`;
  };

  return (
    <View style={styles.container}>
      {angles.leftKnee !== undefined && (
        <Text style={styles.angleText}>
          왼쪽 무릎: {formatAngle(angles.leftKnee)}
        </Text>
      )}
      {angles.rightKnee !== undefined && (
        <Text style={styles.angleText}>
          오른쪽 무릎: {formatAngle(angles.rightKnee)}
        </Text>
      )}
      {angles.leftHip !== undefined && (
        <Text style={styles.angleText}>
          왼쪽 고관절: {formatAngle(angles.leftHip)}
        </Text>
      )}
      {angles.rightHip !== undefined && (
        <Text style={styles.angleText}>
          오른쪽 고관절: {formatAngle(angles.rightHip)}
        </Text>
      )}
      {angles.spine !== undefined && (
        <Text style={styles.angleText}>
          척추: {formatAngle(angles.spine)}
        </Text>
      )}
      {angles.leftShoulder !== undefined && (
        <Text style={styles.angleText}>
          어깨 수평: {formatAngle(angles.leftShoulder)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 8,
  },
  angleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
});
