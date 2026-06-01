// SPEC-UI-001: M3 expo-speech 음성 피드백 래퍼

import type { FeedbackMessage, FormErrorType } from '../types/feedback.types';
import { FEEDBACK_DEBOUNCE_MS } from '../config/feedback.config';

// 테스트 주입을 위한 인터페이스
export interface SpeechService {
  speak(text: string): Promise<void>;
  isSpeaking(): Promise<boolean>;
  stop(): Promise<void>;
}

/* istanbul ignore next -- 네이티브 expo-speech 래퍼, 단위 테스트에서 주입으로 대체 */
class ExpoSpeechService implements SpeechService {
  async speak(text: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Speech = require('expo-speech') as { speak: (text: string) => void };
    Speech.speak(text);
  }

  async isSpeaking(): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Speech = require('expo-speech') as { isSpeakingAsync: () => Promise<boolean> };
    return Speech.isSpeakingAsync();
  }

  async stop(): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Speech = require('expo-speech') as { stop: () => void };
    Speech.stop();
  }
}

// @MX:ANCHOR: 음성 피드백 디바운스 로직의 핵심
// @MX:REASON: 동일 에러 타입의 중복 TTS 방지 (AC-6)
export class AudioFeedbackService {
  private readonly speechService: SpeechService;
  private readonly debounceMap: Map<FormErrorType, number> = new Map();

  constructor(speechService?: SpeechService) {
    this.speechService = speechService ?? new ExpoSpeechService();
  }

  /**
   * 음성 피드백을 재생한다.
   * 같은 errorType 이 FEEDBACK_DEBOUNCE_MS 이내에 다시 호출되면 재생하지 않는다.
   * @returns 실제 재생되면 true, 디바운스로 인해 건너뛰면 false
   */
  async playFeedback(message: FeedbackMessage): Promise<boolean> {
    if (this.isDebounced(message.errorType)) {
      return false;
    }

    // 디바운스 시작 시간 기록
    this.debounceMap.set(message.errorType, Date.now());

    await this.speechService.speak(message.speechText);
    return true;
  }

  /**
   * 디바운스 타이머를 초기화한다.
   * @param errorType 특정 타입 지정 시 해당 타입만, 미지정 시 전체 초기화
   */
  resetDebounce(errorType?: FormErrorType): void {
    if (errorType !== undefined) {
      this.debounceMap.delete(errorType);
    } else {
      this.debounceMap.clear();
    }
  }

  /**
   * 현재 errorType 이 디바운스 상태인지 확인한다.
   */
  isDebounced(errorType: FormErrorType): boolean {
    const lastPlayedAt = this.debounceMap.get(errorType);
    if (lastPlayedAt === undefined) return false;
    return Date.now() - lastPlayedAt < FEEDBACK_DEBOUNCE_MS;
  }
}
