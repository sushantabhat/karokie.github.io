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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      streamRef.current = stream;
      
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);
      analyserRef.current = analyser;
    } catch (err) {
      console.error('Failed to access microphone', err);
      setMicError("Microphone access is blocked!\n\nTo fix on iPhone/Safari:\n1. Tap the 'aA' icon in the web address bar.\n2. Tap 'Website Settings'.\n3. Set Microphone to 'Allow'.\n4. Refresh the page.");
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
    } catch (err) {
      console.error('Failed to access microphone', err);
      setMicError("Microphone access is blocked!\n\nTo fix on iPhone/Safari:\n1. Tap the 'aA' icon in the web address bar.\n2. Tap 'Website Settings'.\n3. Set Microphone to 'Allow'.\n4. Refresh the page.");
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
