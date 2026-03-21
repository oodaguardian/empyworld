import { useState, useRef, useCallback, useEffect } from 'react';

export default function useVoiceSearch() {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('');
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recog = new SpeechRecognition();
    recog.continuous = false;
    recog.interimResults = true;
    recog.lang = 'en-US';

    recog.onstart = () => {
      setIsListening(true);
      setStatus('🎤 Listening... say what you want to watch!');
    };

    recog.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) {
          final += t;
        } else {
          interim += t;
        }
      }
      setTranscript(final || interim);
      if (final) {
        setStatus(`Got it: "${final}"`);
        setTimeout(() => setStatus(''), 2000);
      }
    };

    recog.onerror = (e) => {
      setIsListening(false);
      setStatus(
        e.error === 'not-allowed'
          ? '🚫 Microphone blocked — please allow access'
          : '⚠️ Voice error: ' + e.error
      );
      setTimeout(() => setStatus(''), 3000);
    };

    recog.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recog;
  }, []);

  const toggle = useCallback(() => {
    const recog = recognitionRef.current;
    if (!recog) {
      setStatus('⚠️ Voice search requires Chrome or Edge');
      setTimeout(() => setStatus(''), 3000);
      return;
    }
    if (isListening) {
      recog.stop();
    } else {
      setTranscript('');
      recog.start();
    }
  }, [isListening]);

  const supported = typeof window !== 'undefined' &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return { isListening, status, transcript, toggle, supported };
}
