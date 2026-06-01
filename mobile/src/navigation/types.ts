// SPEC-UI-002: N1 RootStackParamList 타입 안전 라우팅
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ExerciseType } from '../types/pose.types';

// @MX:ANCHOR: 앱 전체 라우트 파라미터 계약 — 모든 화면 props 타입의 근원
// @MX:REASON: HomeScreen, WorkoutSelectionScreen, CameraScreen이 이 타입을 참조함
export type RootStackParamList = {
  Home: undefined;
  WorkoutSelection: undefined;
  Camera: { exercise: ExerciseType };
};

// 타입 안전 화면 props 헬퍼
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type WorkoutSelectionScreenProps = NativeStackScreenProps<RootStackParamList, 'WorkoutSelection'>;
export type CameraScreenProps = NativeStackScreenProps<RootStackParamList, 'Camera'>;
