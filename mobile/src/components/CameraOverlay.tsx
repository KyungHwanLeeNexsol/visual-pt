// SPEC-UI-001: M4 Reanimated + SVG 스켈레톤 오버레이

import React from 'react';
import { Svg, Circle, Line, G } from 'react-native-svg';
import type { FormError } from '../types/feedback.types';

// MediaPipe 스켈레톤 연결 (MVP용 주요 신체 부위)
export const SKELETON_CONNECTIONS: [number, number][] = [
  [11, 12], // 어깨 연결
  [11, 13], [13, 15], // 왼팔
  [12, 14], [14, 16], // 오른팔
  [11, 23], [12, 24], // 몸통 측면
  [23, 24], // 골반
  [23, 25], [25, 27], // 왼다리
  [24, 26], [26, 28], // 오른다리
];

// 에러 조인트 이름 → 랜드마크 인덱스 매핑
const JOINT_LANDMARK_MAP: Record<string, number[]> = {
  leftKnee: [25],
  rightKnee: [26],
  spine: [11, 12, 23, 24],
  leftHip: [23],
  rightHip: [24],
  leftShoulder: [11],
  rightShoulder: [12],
};

const DEFAULT_COLOR = '#39FF14'; // 정상 관절 색상 (네온 그린 — Pencil 디자인 기준)
const ERROR_COLOR = '#FF5252';   // 오류 관절 색상 (소프트 레드)
const JOINT_RADIUS = 6;
const LINE_STROKE_WIDTH = 2.5;

interface LandmarkPoint {
  x: number;
  y: number;
  visibility: number;
}

interface Props {
  landmarks: LandmarkPoint[] | null;
  errors: FormError[];
  width: number;
  height: number;
}

// @MX:ANCHOR: 스켈레톤 렌더링 컴포넌트 — CameraScreen에서 참조
// @MX:REASON: CameraScreen, CameraGuideOverlay에서 참조 (fan_in >= 2)
export function CameraOverlay({ landmarks, errors, width, height }: Props): React.JSX.Element {
  if (!landmarks || landmarks.length === 0) {
    return <Svg width={width} height={height} />;
  }

  // 에러가 있는 랜드마크 인덱스 집합
  const errorIndices = new Set<number>();
  errors.forEach((error) => {
    const indices = JOINT_LANDMARK_MAP[error.joint] ?? [];
    indices.forEach((idx) => errorIndices.add(idx));
  });

  // 정규화된 좌표를 픽셀 좌표로 변환
  const toPixel = (point: LandmarkPoint) => ({
    px: point.x * width,
    py: point.y * height,
  });

  return (
    <Svg width={width} height={height}>
      <G>
        {/* 스켈레톤 연결선 */}
        {SKELETON_CONNECTIONS.map(([from, to]) => {
          const fromPoint = landmarks[from];
          const toPoint = landmarks[to];
          if (!fromPoint || !toPoint) return null;
          if (fromPoint.visibility < 0.3 || toPoint.visibility < 0.3) return null;

          const { px: x1, py: y1 } = toPixel(fromPoint);
          const { px: x2, py: y2 } = toPixel(toPoint);
          const isError = errorIndices.has(from) || errorIndices.has(to);

          return (
            <Line
              key={`line-${from}-${to}`}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={isError ? ERROR_COLOR : DEFAULT_COLOR}
              strokeWidth={LINE_STROKE_WIDTH}
            />
          );
        })}

        {/* 관절 점 */}
        {landmarks.map((point, index) => {
          if (!point || point.visibility < 0.3) return null;
          const { px, py } = toPixel(point);
          const isError = errorIndices.has(index);

          return (
            <Circle
              key={`joint-${index}`}
              cx={px}
              cy={py}
              r={JOINT_RADIUS}
              fill={isError ? ERROR_COLOR : DEFAULT_COLOR}
            />
          );
        })}
      </G>
    </Svg>
  );
}
