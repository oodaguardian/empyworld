import { useCallback } from 'react';
import { ttsSpeak, ttsStop } from '../services/ttsService';

export default function useTTS() {
  const speak = useCallback((text, options = {}) => {
    if (!text) return;
    ttsSpeak(text, { onEnd: options.onEnd });
  }, []);

  const stop = useCallback(() => {
    ttsStop();
  }, []);

  return { speak, stop, supported: true };
}
