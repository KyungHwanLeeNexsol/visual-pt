// SPEC-UI-002: N1 네이티브 스택 네비게이터 (Home → WorkoutSelection → Camera)

// @MX:ANCHOR: 앱 전체 화면 라우팅의 단일 진입점
// @MX:REASON: HomeScreen, WorkoutSelectionScreen, CameraScreen이 모두 여기서 등록됨
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';
import { HomeScreen } from '../screens/HomeScreen';
import { WorkoutSelectionScreen } from '../screens/WorkoutSelectionScreen';
import { CameraScreen } from '../screens/CameraScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="WorkoutSelection" component={WorkoutSelectionScreen} />
      <Stack.Screen name="Camera" component={CameraScreen} />
    </Stack.Navigator>
  );
}
