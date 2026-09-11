'use client';

import { useState, useRef, useCallback } from 'react';

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [micError, setMicError] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const prepareRecording = useCallback(async () => {
    if (streamRef.current) return;
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
      } catch (constraintErr) {
        // Fallback for strict mobile browsers that reject specific audio constraints
        console.warn("Strict audio constraints rejected, falling back to basic audio: true", constraintErr);
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      streamRef.current = stream;
      
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
    } catch (err: any) {
      console.error('Failed to access microphone', err);
      if (!navigator.mediaDevices) {
         setMicError("Microphone access is blocked because your connection is not secure. You must use HTTPS (or localhost) to record audio.");
      } else {
         setMicError(`Microphone access failed: ${err.message || err.name || 'Permission Denied'}.\n\nPlease ensure you have granted microphone permissions in your browser settings and refresh the page.`);
      }
    }
  }, []);

  const startRecording = useCallback(async () => {
    try {
      if (!streamRef.current) {
        await prepareRecording();
      }
      if (!streamRef.current) return;
      const stream = streamRef.current;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm;codecs=opus' });
        setRecordedBlob(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Failed to access microphone', err);
      if (!navigator.mediaDevices) {
         setMicError("Microphone access is blocked because your connection is not secure. You must use HTTPS (or localhost) to record audio.");
      } else {
         setMicError(`Microphone access failed: ${err.message || err.name || 'Permission Denied'}.\n\nPlease ensure you have granted microphone permissions in your browser settings and refresh the page.`);
      }
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (isRecording || isPaused)) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (audioCtxRef.current?.state !== 'closed') {
        audioCtxRef.current?.close();
      }
      analyserRef.current = null;
      
      // Stop all tracks to release the microphone
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, [isRecording, isPaused]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  }, [isPaused]);

  const resetRecording = useCallback(() => {
    setRecordedBlob(null);
    chunksRef.current = [];
    setIsPaused(false);
    setIsRecording(false);
  }, []);

  return {
    isRecording,
    isPaused,
    micError,
    recordedBlob,
    prepareRecording,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    resetRecording,
    getAnalyser: () => analyserRef.current, setRecordedBlob
  };
}
