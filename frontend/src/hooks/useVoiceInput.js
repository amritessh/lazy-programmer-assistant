import { useState, useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

export const useVoiceInput = (options = {}) => {
  const {
    continuous = false,
    interimResults = true,
    language = 'en-US',
    maxAlternatives = 1,
    onStart = () => {},
    onEnd = () => {},
    onResult = () => {},
    onError = () => {}
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState(null);
  const [confidence, setConfidence] = useState(0);

  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const startTimeRef = useRef(null);

  // Initialize speech recognition
  useEffect(
    () => {
      if (typeof window !== 'undefined') {
        const SpeechRecognition =
          window.SpeechRecognition || window.webkitSpeechRecognition;

        if (SpeechRecognition) {
          setIsSupported(true);
          recognitionRef.current = new SpeechRecognition();

          const recognition = recognitionRef.current;
          recognition.continuous = continuous;
          recognition.interimResults = interimResults;
          recognition.lang = language;
          recognition.maxAlternatives = maxAlternatives;

          // Event handlers
          recognition.onstart = () => {
            setIsListening(true);
            setError(null);
            startTimeRef.current = Date.now();
            onStart();
          };

          recognition.onresult = event => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const result = event.results[i];
              const transcript = result[0].transcript;
              const confidence = result[0].confidence;

              if (result.isFinal) {
                finalTranscript += transcript;
                setConfidence(confidence);
              } else {
                interimTranscript += transcript;
              }
            }

            if (finalTranscript) {
              setTranscript(prev => prev + finalTranscript);
              onResult(finalTranscript, confidence);
            }

            setInterimTranscript(interimTranscript);
          };

          recognition.onend = () => {
            setIsListening(false);
            setInterimTranscript('');
            onEnd();
          };

          recognition.onerror = event => {
            setError(event.error);
            setIsListening(false);

            let errorMessage = 'Speech recognition error';

            switch (event.error) {
              case 'no-speech':
                errorMessage = 'No speech detected. Please try again.';
                break;
              case 'audio-capture':
                errorMessage =
                  'No microphone found. Please check your microphone.';
                break;
              case 'not-allowed':
                errorMessage =
                  'Microphone access denied. Please allow microphone access.';
                break;
              case 'network':
                errorMessage = 'Network error. Please check your connection.';
                break;
              case 'aborted':
                // Don't show error for aborted recognition
                return;
              default:
                errorMessage = `Speech recognition error: ${event.error}`;
            }

            toast.error(errorMessage);
            onError(event.error);
          };
        } else {
          setIsSupported(false);
          console.warn('Speech recognition not supported in this browser');
        }
      }

      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.abort();
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    },
    [
      continuous,
      interimResults,
      language,
      maxAlternatives,
      onStart,
      onEnd,
      onResult,
      onError
    ]
  );

  // Start listening
  const startListening = useCallback(
    () => {
      if (!isSupported) {
        toast.error('Speech recognition not supported in this browser');
        return;
      }

      if (!recognitionRef.current) {
        toast.error('Speech recognition not initialized');
        return;
      }

      try {
        setTranscript('');
        setInterimTranscript('');
        setError(null);
        recognitionRef.current.start();

        // Auto-stop after 30 seconds to prevent infinite listening
        timeoutRef.current = setTimeout(() => {
          stopListening();
          toast.warning('Voice input stopped automatically after 30 seconds');
        }, 30000);
      } catch (error) {
        console.error('Failed to start voice recognition:', error);
        toast.error('Failed to start voice recognition');
      }
    },
    [isSupported]
  );

  // Stop listening
  const stopListening = useCallback(
    () => {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    },
    [isListening]
  );

  // Abort listening
  const abortListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setIsListening(false);
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);
  }, []);

  // Toggle listening
  const toggleListening = useCallback(
    () => {
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
    },
    [isListening, startListening, stopListening]
  );

  // Check microphone permission
  const checkMicrophonePermission = useCallback(async () => {
    try {
      const permission = await navigator.permissions.query({
        name: 'microphone'
      });
      return permission.state;
    } catch (error) {
      console.warn('Failed to check microphone permission:', error);
      return 'unknown';
    }
  }, []);

  // Request microphone permission
  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream
      return true;
    } catch (error) {
      console.error('Microphone permission denied:', error);
      toast.error('Microphone access is required for voice input');
      return false;
    }
  }, []);

  // Get listening duration
  const getListeningDuration = useCallback(() => {
    if (!startTimeRef.current) return 0;
    return Date.now() - startTimeRef.current;
  }, []);

  // Combined transcript (final + interim)
  const fullTranscript = transcript + interimTranscript;

  return {
    // State
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    fullTranscript,
    error,
    confidence,

    // Actions
    startListening,
    stopListening,
    abortListening,
    resetTranscript,
    toggleListening,

    // Utilities
    checkMicrophonePermission,
    requestMicrophonePermission,
    getListeningDuration,

    // Status
    hasTranscript: transcript.length > 0,
    hasInterimTranscript: interimTranscript.length > 0,
    isActive: isListening || transcript.length > 0
  };
};
