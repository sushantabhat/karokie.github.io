/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
'use client';

import { useState, useRef, useEffect } from 'react';
import WaveformEditor from "@/components/shared/WaveformEditor";


import { Upload, Headphones, Mic, Play, Pause, Square, Settings2, Download, CheckCircle2, Volume2, Mic2, FileText, RotateCcw, Target, Plus, Minus, Save, FolderOpen, Trash2, Sun, Moon } from 'lucide-react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useAudioMixer, MixSettings } from '@/hooks/useAudioMixer';
import { useTheme } from '@/hooks/useTheme';
import { useUnsavedChanges } from '@/providers/UnsavedChangesProvider';
import { saveTrackToDB, getTrackFromDB, saveVocalToDB, getVocalFromDB, clearTrackFromDB, clearVocalFromDB } from '@/utils/indexedDB';
import { audioBufferToWav } from '@/utils/audioBufferToWav';
import { track } from "@vercel/analytics";
import { Joyride, Step, EventData, STATUS } from 'react-joyride';

const readVar = (name: string) =>
  typeof window !== 'undefined'
    ? getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    : '';

const sliderFillStyle = (value: number, min: number, max: number): React.CSSProperties => {
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return { background: `linear-gradient(to right, var(--slider-fill) ${pct}%, var(--slider-track) ${pct}%)` };
};

type DialogOption = { label: string; value: string; style?: "primary" | "danger" | "secondary" };

type DialogState = {
  title: string;
  message?: string;
  type: "confirm" | "prompt" | "options";
  options?: DialogOption[];
  defaultValue?: string;
  resolve: (value: any) => void;
};

function StaticWaveform({ buffer, color, duration, currentTime, totalDuration, onSeekStart, onSeekDrag, onSeekEnd, emptyText = "No Audio Data" }: { buffer: AudioBuffer | null, color: string | string[], duration: number, currentTime: number, totalDuration?: number, onSeekStart?: (time: number) => void, onSeekDrag?: (time: number) => void, onSeekEnd?: (time: number) => void, emptyText?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  
  const [isDraggingState, setIsDraggingState] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !buffer) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Scale for high DPI displays if needed (keeping it simple for now)
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const data = buffer.getChannelData(0);
    const actualTotalDuration = totalDuration || buffer.duration;
    const widthProportion = Math.min(buffer.duration / actualTotalDuration, 1.0);
    const targetWidth = canvas.width * widthProportion;
    
    const step = Math.ceil(data.length / targetWidth);
    
    let fillStyle: string | CanvasGradient = '';
    if (Array.isArray(color)) {
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, color[0]);
      gradient.addColorStop(1, color[1] || color[0]);
      fillStyle = gradient;
    } else {
      fillStyle = color;
    }
    
    ctx.fillStyle = fillStyle;
    
    // Glowing neon effect for waveform
    ctx.shadowBlur = 10;
    ctx.shadowColor = Array.isArray(color) ? color[0] : color;

    for (let i = 0; i < targetWidth; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) {
        const index = (i * step) + j;
        if (index < data.length) {
          sum += Math.abs(data[index]);
        }
      }
      
      const average = sum / step;
      // Multiply by a factor to make the waveform look full but dynamic
      const scaledHeight = Math.min(1.0, average * 3.5) * canvas.height;
      const height = Math.max(1, scaledHeight);
      const y = (canvas.height - height) / 2;
      
      ctx.fillRect(i, y, 1, height);
    }
  }, [buffer, color, totalDuration]);

  const actualTotalDuration = totalDuration || duration;
  const progress = actualTotalDuration > 0 ? (currentTime / actualTotalDuration) * 100 : 0;

  const calculateSeekTime = (clientX: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    return percentage * actualTotalDuration;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    isDragging.current = true;
    setIsDraggingState(true);
    if (onSeekStart) onSeekStart(calculateSeekTime(e.clientX));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging.current && onSeekDrag) {
      onSeekDrag(calculateSeekTime(e.clientX));
    }
  };

  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent) => {
      if (isDragging.current) {
        isDragging.current = false;
        setIsDraggingState(false);
        if (onSeekEnd) onSeekEnd(calculateSeekTime(e.clientX));
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
     
  }, [onSeekEnd, actualTotalDuration]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full bg-wave-bg ${onSeekStart ? 'cursor-pointer select-none' : ''}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
    >
      {buffer ? (
        <canvas ref={canvasRef} className="w-full h-full opacity-50 light:opacity-80 pointer-events-none" />
      ) : (
        <div className="w-full h-full flex items-center justify-center pointer-events-none">
          <span className="text-secondary text-xs font-mono">{emptyText}</span>
        </div>
      )}
      <div 
        className="absolute top-0 bottom-0 w-[2px] bg-[#3b82f6] z-10 shadow-[0_0_8px_rgba(59,130,246,0.8)] pointer-events-none"
        style={{ left: `${Math.min(progress, 100)}%`, transition: isDraggingState ? 'none' : 'left 0.1s linear' }}
      />
    </div>
  );
}

// ==== Auto-Save (localStorage) helpers ====
export const playCountIn = async (bpm: number) => {
  return new Promise<void>((resolve) => {
    const beatDuration = 60 / bpm;
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const startTime = ctx.currentTime + 0.1;
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = i === 0 ? 1200 : 800;
      const time = startTime + i * beatDuration;
      osc.start(time);
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(1, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      osc.stop(time + 0.1);
    }
    setTimeout(() => {
      ctx.close();
      resolve();
    }, (beatDuration * 4 + 0.1) * 1000);
  });
};

// Key for the index that tracks recent saved tracks (max 10)
const AUTOSAVE_INDEX_KEY = 'lyricsAutosaveIndex';
const AUTOSAVE_MAX = 10;

// Compute SHA-256 hash of a File (hex string)
const hashFile = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export type LineSync = { id: string; text: string; start: number | null; end: number | null; };

const loadLyricsFromLocalStorage = (hash: string) => {
  const data = localStorage.getItem(`lyrics-autosave-${hash}`);
  if (!data) return null;
  try {
    const parsed = JSON.parse(data);
    if (parsed && parsed.length > 0 && !parsed[0].id) {
      localStorage.removeItem(`lyrics-autosave-${hash}`);
      return null;
    }
    return parsed;
  } catch {
    // Corrupt entry - clean it up
    localStorage.removeItem(`lyrics-autosave-${hash}`);
    return null;
  }
};

const saveLyricsToLocalStorage = (hash: string, ly: LineSync[]) => {
  // Disabled as per request to not save any data for karaoke studio
  return;
};

export default function KaraokeStudio() {
  const { setHasUnsavedChanges } = useUnsavedChanges();
  const [trackFile, setTrackFile] = useState<File | null>(null);
  const isVideo = trackFile && trackFile.type.startsWith('video/');
  const [trackUrl, setTrackUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (trackUrl) URL.revokeObjectURL(trackUrl);
    };
  }, [trackUrl]);

  const [headphonesConfirmed, setHeadphonesConfirmed] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [runTour, setRunTour] = useState(false);
  const tourSteps: Step[] = [
    {
      target: '.tour-step-3',
      content: (
        <div className="text-left flex flex-col gap-1">
          <strong className="text-base">1. Load your Lyrics 📝</strong>
          <span className="text-sm opacity-90">Need the words? Click here to import an .LRC, .SRT, or .VTT file for the teleprompter.</span>
          <span className="text-[11px] opacity-70 mt-1 italic">Pro tip: You can create these in our Lyrics Sync tool!</span>
        </div>
      ),
      skipBeacon: true,
      placement: 'bottom',
      spotlightPadding: 10,
    },
    {
      target: '.tour-step-2',
      content: (
        <div className="text-left flex flex-col gap-1">
          <strong className="text-base">2. Hit Record 🔴</strong>
          <span className="text-sm opacity-90">Tap the red dot to start recording your vocals over the beat. Don&apos;t worry about being perfect—you can always redo it!</span>
        </div>
      ),
      skipBeacon: true,
      placement: 'bottom',
      spotlightPadding: 8,
    },

    {
      target: '.tour-step-4',
      content: (
        <div className="text-left flex flex-col gap-1">
          <strong className="text-base">3. Final Polish ✨</strong>
          <span className="text-sm opacity-90">Toggle on Studio Reverb, adjust your mix volumes, and hit Export to save your masterpiece!</span>
        </div>
      ),
      skipBeacon: true,
      placement: 'top',
      spotlightPadding: 10,
    },
  ];
  const { 
    isRecording, isPaused: isRecPaused, micError, 
    recordedBlob, setRecordedBlob, prepareRecording, startRecording, stopRecording, pauseRecording, resumeRecording, resetRecording, getAnalyser 
  } = useAudioRecorder();

  const { 
    loadTrack, loadVocal, mergeVocal, clearVocal, clearTrack, playPreview, stopPreview, exportMix,
    isPlaying, isProcessing, setTrackVolumeLive, setVocalVolumeLive,
    trackBuffer, vocalBuffer, getPlaybackPosition 
  } = useAudioMixer();

  const { theme, toggleTheme } = useTheme();

  type Tab = "MIXER" | "SYNC" | "EDIT";
  const [activeTab, setActiveTab] = useState<Tab>("MIXER");
  const [showMobileMixer, setShowMobileMixer] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [isSpacebarDown, setIsSpacebarDown] = useState(false);
  const [isSyncSessionActive, setIsSyncSessionActive] = useState(false);
  const [isCountingIn, setIsCountingIn] = useState(false);

  const [rawLyricsText, setRawLyricsText] = useState("");
  const [lyrics, setLyrics] = useState<LineSync[]>([]);
  const [activeWordIndex, setActiveWordIndex] = useState(0);
  const [isPainting, setIsPainting] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  
  const audioRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const punchInTimeRef = useRef<number>(0);
  const previewStartTimeRef = useRef<number>(0);
  const previewStartOffsetRef = useRef<number>(0);

  const [mixSettings, setMixSettings] = useState<MixSettings>({
    trackVolume: 80,
    vocalVolume: 100,
    latencyOffsetMs: 0,
    reverbEnabled: false,
    countInEnabled: false,
    bpm: 120,
  });

  // ==== UI state ====
  const [, setAutoSaved] = useState(false);
  const [trackHash, setTrackHash] = useState<string | null>(null);

  // Auto-save lyrics whenever they change
  useEffect(() => {
    if (trackHash) {
      saveLyricsToLocalStorage(trackHash, lyrics);
    }
  }, [lyrics, trackHash]);

  // Restore session from IndexedDB on mount
  useEffect(() => {
    async function restoreSession() {
      try {
        const savedTrack = await getTrackFromDB();
        if (savedTrack && savedTrack.file) {
          setTrackFile(savedTrack.file);
          const url = URL.createObjectURL(savedTrack.file);
          setTrackUrl(url);
          setTrackHash(savedTrack.hash);
          
          const saved = loadLyricsFromLocalStorage(savedTrack.hash);
          if (saved) {
            setLyrics(saved);
            setAutoSaved(true);
            setTimeout(() => setAutoSaved(false), 3000);
          }
          await loadTrack(savedTrack.file);
        }

        const savedVocal = await getVocalFromDB();
        if (savedVocal) {
          setRecordedBlob(savedVocal);
        }

        const savedTime = localStorage.getItem('playbackTime');
        if (savedTime) {
          setCurrentTime(parseFloat(savedTime));
        }
      } catch (err) {
        console.error("Failed to restore session from DB", err);
      }
    }
    restoreSession();
  }, [loadTrack, loadVocal]);

  // Auto-save playback time (Disabled per request)
  // useEffect(() => {
  //   // localStorage.setItem('playbackTime', currentTime.toString());
  // }, [currentTime]);
  // Update unsaved changes state when track, vocals, or lyrics change
  useEffect(() => {
    setHasUnsavedChanges(trackFile !== null || vocalBuffer !== null || lyrics.length > 0 || rawLyricsText.trim() !== "");
    return () => setHasUnsavedChanges(false);
  }, [trackFile, vocalBuffer, lyrics, rawLyricsText, setHasUnsavedChanges]);

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];
    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem('hasSeenTour_v3', 'true');
    }
  };

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Trigger tour only AFTER they upload a track for the first time
  useEffect(() => {
    if (trackFile && isMounted) {
      if (!localStorage.getItem('hasSeenTour_v3')) {
        setTimeout(() => setRunTour(true), 500);
      }
    }
  }, [trackFile, isMounted]);

  // ==== Export .LRC ====
  const formatLRC = () => {
    return lyrics
      .filter(l => l.start !== null)
      .map(l => {
        const t = l.start!;
        const mins = Math.floor(t / 60);
        const secs = (t % 60).toFixed(2).padStart(5, '0');
        return `[${mins}:${secs}] ${l.text}`;
      })
      .join('\n');
  };

  const handleExportLRC = () => {
    const lrc = formatLRC();
    const blob = new Blob([lrc], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const baseName = trackFile?.name.replace(/\.mp3$/i, '') || 'lyrics';
    a.download = `${baseName}.lrc`;
    a.click();
    URL.revokeObjectURL(url);
  };

   
  const updateSetting = (key: keyof MixSettings, value: any) => {
    setMixSettings((prev: MixSettings) => ({ ...prev, [key]: value }));
  };

  const handleTrackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Security/UX check: strictly block images or unsupported files
      if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
        setDialog({
          type: 'confirm',
          title: 'Invalid File',
          message: 'Please upload an audio or video file (like .mp3 or .mp4). Photos are not supported!',
          resolve: () => setDialog(null)
        });
        e.target.value = ''; // Reset input
        return;
      }
      
      setTrackFile(file);
      const url = URL.createObjectURL(file);
      setTrackUrl(url);
      track('Loaded Instrumental');
      // Compute hash, load any saved lyrics, and set toast flag
      const hash = await hashFile(file);
      setTrackHash(hash);
      const saved = loadLyricsFromLocalStorage(hash);
      if (saved) {
        setLyrics(saved);
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 3000);
      }
      
      // Save track to IndexedDB disabled per request
      // await saveTrackToDB({ file, hash, name: file.name });
      
      await loadTrack(file);
    }
  };
  // Handle LRC file upload and parsing
  const handleLRCUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      track('Imported LRC');
      const reader = new FileReader();
      reader.onload = (ev) => {
        const absIdx = 0;
        const text = ev.target?.result as string;
        let parsed: LineSync[] = [];
        const lines = text.split('\n').map(l => l.trim());
        
        if (text.includes('-->')) {
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('-->')) {
              const timeMatch = line.match(/(?:(\d{2}):)?(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(?:(\d{2}):)?(\d{2}):(\d{2})[,.](\d{3})/);
              if (timeMatch) {
                const h1 = parseInt(timeMatch[1] || '0', 10);
                const m1 = parseInt(timeMatch[2], 10);
                const s1 = parseInt(timeMatch[3], 10);
                const ms1 = parseInt(timeMatch[4], 10);
                const start = h1 * 3600 + m1 * 60 + s1 + ms1 / 1000;
                
                let txt = '';
                let j = i + 1;
                while (j < lines.length && lines[j] !== '' && !lines[j].match(/^\d+$/)) {
                  txt += (txt ? ' ' : '') + lines[j];
                  j++;
                }
                
                if (txt) {
                  parsed.push({
                    id: "line-" + Date.now() + "-" + Math.random(),
                    text: txt,
                    start: start,
                    end: null
                  });
                }
                i = j - 1;
              }
            }
          }
        } else {
          parsed = lines.map((line) => {
            const match = line.match(/\[(\d+):(\d{2}\.\d{2,3})\](.*)/);
            if (match) {
              const mins = parseInt(match[1], 10);
              const secs = parseFloat(match[2]);
              const time = mins * 60 + secs;
              const txt = match[3].trim();
              return { id: "line-" + Date.now() + "-" + Math.random(), text: txt, start: time, end: null } as LineSync;
            }
            const txt = line.trim();
            if (txt) {
               return { id: "line-" + Date.now() + "-" + Math.random(), text: txt, start: null, end: null } as LineSync;
            }
            return null;
          }).filter((l): l is LineSync => l !== null && l.text !== '');
        }
        setLyrics(parsed);
        // Show a toast indicating LRC loaded
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 3000);
      };
      reader.readAsText(file);
    }
  };
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const handleStartRecording = async () => {
    // CRITICAL FIX: We MUST request the microphone immediately on the click event!
    // If we wait for a React dialog (like Headphones Required) first, mobile Safari/Chrome
    // will destroy the "User Gesture" security token and silently block getUserMedia.
    const micReady = await prepareRecording();
    if (!micReady) return; // User denied or error occurred, banner will show automatically.

    if (!headphonesConfirmed) {
      const confirmed = await showDialog({
        title: "Headphones Required",
        message: "Please wear headphones to prevent audio feedback (echo) from your speakers.",
        type: "confirm"
      });
      if (!confirmed) return;
      setHeadphonesConfirmed(true);
    }

    let isContinueTake = false;

    if (vocalBuffer) {
      const takeMode = await showDialog({
        title: "Continue or Restart?",
        message: "Do you want to continue your last take, or wipe it and start fresh? (Continuing will play a 3-second pre-roll so you can catch the pitch).",
        type: "options",
        options: [
          { label: "Continue Take", value: "continue", style: "primary" },
          { label: "Start Fresh", value: "fresh", style: "danger" }
        ]
      });
      if (!takeMode) return; // cancelled
      
      if (takeMode === "continue") {
        // If they seeked, use that time. Otherwise append to the end.
        // If they placed the playhead manually (currentTime > 0), punch in EXACTLY there.
        // Otherwise, default to the very end of the recorded buffer.
        const startTime = currentTime > 0 ? currentTime : vocalBuffer.duration;
        punchInTimeRef.current = startTime;
        setCurrentTime(startTime);
        isContinueTake = true;
      } else {
        clearVocal();
        punchInTimeRef.current = 0;
        setCurrentTime(0);
      }
    } else {
      punchInTimeRef.current = currentTime;
    }

    stopPreview();
    
    let actualWaitTime = 0;
    
    if (isContinueTake && punchInTimeRef.current > 0) {
      const preRollDuration = 3; 
      const preRollStart = Math.max(0, punchInTimeRef.current - preRollDuration);
      actualWaitTime = punchInTimeRef.current - preRollStart;
      
      if (actualWaitTime > 0) {
         setIsCountingIn(true);
         setCountdown(Math.ceil(actualWaitTime));
         
         if (audioRef.current) {
           audioRef.current.volume = Math.min(mixSettings.trackVolume / 100, 1);
           audioRef.current.currentTime = preRollStart;
           // Start pre-roll playback
           audioRef.current.play().catch((e: any) => console.error(e));
         }
         
         const iv = setInterval(() => setCountdown(c => (c ? c - 1 : null)), 1000);
         
         // Wait for the media element to physically reach the punch-in time
         // This fixes video buffering lag making the punch-in time wildly inaccurate
         await new Promise<void>(resolve => {
           if (!audioRef.current) {
             setTimeout(resolve, actualWaitTime * 1000);
             return;
           }
           const checkTime = () => {
             if (audioRef.current && audioRef.current.currentTime >= punchInTimeRef.current) {
               audioRef.current.removeEventListener('timeupdate', checkTime);
               resolve();
             }
           };
           audioRef.current.addEventListener('timeupdate', checkTime);
           // Fallback just in case timeupdate fails or hangs
           setTimeout(() => {
             if (audioRef.current) audioRef.current.removeEventListener('timeupdate', checkTime);
             resolve();
           }, (actualWaitTime * 1000) + 2000);
         });
         
         clearInterval(iv);
         
         setIsCountingIn(false);
         setCountdown(null);
      }
    } else if (mixSettings.countInEnabled && mixSettings.bpm) {
      setIsCountingIn(true);
      setCountdown(4);
      const beatDuration = (60 / mixSettings.bpm) * 1000;
      const iv = setInterval(() => setCountdown(c => (c ? c - 1 : null)), beatDuration);
      await playCountIn(mixSettings.bpm);
      clearInterval(iv);
      setIsCountingIn(false);
      setCountdown(null);
    }

    // Capture the EXACT time of the backing track right before we trigger MediaRecorder
    if (audioRef.current && isContinueTake && actualWaitTime > 0) {
      punchInTimeRef.current = audioRef.current.currentTime;
    }

    resetRecording();
    await startRecording();
    
    // If we didn't do a pre-roll, start the backing track NOW
    if (audioRef.current && (!isContinueTake || actualWaitTime <= 0)) {
      audioRef.current.volume = Math.min(mixSettings.trackVolume / 100, 1);
      audioRef.current.currentTime = punchInTimeRef.current;
      audioRef.current.play().catch((e: any) => console.error(e));
    }
  };

  const handleStopRecording = () => {
    stopRecording();
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const handlePauseResumeRecording = () => {
    if (isRecPaused) {
      resumeRecording();
      if (audioRef.current) audioRef.current.play();
    } else {
      pauseRecording();
      if (audioRef.current) audioRef.current.pause();
    }
  };

  // Time tracker for UI
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording && !isRecPaused) {
      interval = setInterval(() => {
        if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
      }, 100);
    } else if (isPlaying) {
      interval = setInterval(() => {
        const nextTime = getPlaybackPosition();
        if (nextTime < 0) return;
        
        setCurrentTime(nextTime);
        
        // Auto-stop when reviewing synced lyrics in SYNC tab
        setLyrics(currentLyrics => {
            if (activeTab === "SYNC" && !isSyncSessionActive && currentLyrics.length > 0) {
              let lastSyncedLyric = null;
              for (let i = currentLyrics.length - 1; i >= 0; i--) {
                if (currentLyrics[i].start !== null) {
                  lastSyncedLyric = currentLyrics[i];
                  break;
                }
              }
              
              if (lastSyncedLyric) {
                const stopTime = lastSyncedLyric.end !== null ? lastSyncedLyric.end + 1.0 : lastSyncedLyric.start! + 4.0;
                if (nextTime >= stopTime) {
                  setTimeout(() => {
                    stopPreview();
                    if (audioRef.current) audioRef.current.currentTime = 0;
                    setCurrentTime(0);
                  }, 0);
                }
              }
            }
            return currentLyrics;
          });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRecording, isRecPaused, isPlaying, isSyncSessionActive, activeTab, stopPreview, getPlaybackPosition]); 

  // Sync Video playback with isPlaying and isRecording
  useEffect(() => {
    if (!audioRef.current || !isVideo) return;
    
    if (isPlaying || isRecording) {
      // Sync the time before playing just to be perfectly aligned
      if (Math.abs(audioRef.current.currentTime - currentTime) > 0.3) {
        audioRef.current.currentTime = currentTime;
      }
      
      // If previewing, we want the video muted because useAudioMixer handles the actual audio buffer!
      // If recording, useAudioMixer doesn't play the buffer, so the video MUST provide the audio.
      if (isPlaying && !isRecording) {
        audioRef.current.volume = 0;
      } else if (isRecording) {
        audioRef.current.volume = Math.min(mixSettings.trackVolume / 100, 1);
      }
      
      audioRef.current.play().catch((e: any) => console.error("Video auto-play error:", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, isRecording, isVideo]); // purposely omitting currentTime to avoid stuttering on every tick

  // Visualizer loop
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = getAnalyser();
    if (!isRecording || isRecPaused || !analyser) {
      ctx.fillStyle = readVar('--wave-bg') || '#121214';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = readVar('--secondary') || '#424754';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      return;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let animationId: number;

    const draw = () => {
      animationId = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = readVar('--wave-bg') || '#121214';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = '#3b82f6';
      ctx.beginPath();

      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * canvas.height / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [isRecording, isRecPaused, getAnalyser]);




  useEffect(() => {
    if (recordedBlob) {
      if (punchInTimeRef.current > 0 && vocalBuffer) {
        mergeVocal(recordedBlob, punchInTimeRef.current);
      } else {
        loadVocal(recordedBlob);
      }
    }
  }, [recordedBlob, loadVocal, mergeVocal, clearVocal, clearTrack, vocalBuffer]);

  const [trackMuted, setTrackMuted] = useState(false);
  const [vocalMuted, setVocalMuted] = useState(false);
  const [showFullLyrics, setShowFullLyrics] = useState(false);
  
  const showDialog = (config: Omit<DialogState, "resolve">): Promise<any> => {
    return new Promise((resolve) => {
      setDialog({ ...config, resolve });
    });
  };

  const [dialog, setDialog] = useState<DialogState | null>(null);


  const handleNewSession = async () => {
    const confirmed = await showDialog({
      title: "Start Over?",
      message: "Are you sure you want to start over? Unsaved progress will be lost.",
      type: "confirm"
    });
    if (confirmed) {
      if (isPlaying) handleStopClick();
      setTrackFile(null);
      setTrackUrl(null);
      clearTrack(); // useAudioMixer will handle null or we can just ignore since UI will block play
      clearTrackFromDB().catch(console.error);
      setRecordedBlob(null);
      clearVocal();
      clearVocalFromDB().catch(console.error);
      setLyrics([]);
      setRawLyricsText("");
      setCurrentTime(0);
      setIsSyncSessionActive(false);
    }
  };


  // Mute Logic
  const effectiveTrackVolume = trackMuted ? 0 : mixSettings.trackVolume;
  const effectiveVocalVolume = vocalMuted || (activeTab === 'SYNC' || activeTab === 'EDIT') ? 0 : mixSettings.vocalVolume;

  // Apply live volume changes when Mute state changes
  useEffect(() => {
    if (isPlaying) {
      setTrackVolumeLive(effectiveTrackVolume);
      setVocalVolumeLive(effectiveVocalVolume);
    }
  }, [trackMuted, vocalMuted, isPlaying, effectiveTrackVolume, effectiveVocalVolume, setTrackVolumeLive, setVocalVolumeLive]);

  const masterDuration = Math.max(trackBuffer?.duration || 0, vocalBuffer?.duration || 0);

  const wasPlayingBeforeDrag = useRef(false);

  const handleSeekStart = (time: number) => {
    if (isRecording) return;
    setCurrentTime(time);
    
    wasPlayingBeforeDrag.current = isPlaying;
    if (isPlaying) {
      stopPreview(); // Stop audio immediately so dragging is silent and safe
    }
  };

  const handleSeekDrag = (time: number) => {
    if (isRecording) return;
    setCurrentTime(time);
  };

  const startPlayback = (timeOffset: number) => {
    previewStartTimeRef.current = performance.now();
    previewStartOffsetRef.current = timeOffset;
    
    if (audioRef.current && isVideo) {
      audioRef.current.currentTime = timeOffset;
      audioRef.current.play().catch((e: any) => console.error("Video sync play error:", e));
    }
    
    playPreview({
      ...mixSettings,
      trackVolume: effectiveTrackVolume,
      vocalVolume: effectiveVocalVolume
    }, timeOffset);
  };

  const handleSeekEnd = (time: number) => {
    if (isRecording) return;
    setCurrentTime(time);
    
    if (isVideo && audioRef.current) {
       audioRef.current.currentTime = time;
    }
    
    if (wasPlayingBeforeDrag.current) {
      startPlayback(time);
    }
  };

  const handlePlayPreviewClick = () => {
    if (isPlaying) {
      stopPreview();
    } else {
      startPlayback(currentTime);
    }
  };

  const handleExportClick = async () => {
    const mode = await showDialog({
      title: "Export Mix",
      message: "How much of the track do you want to export?",
      type: "options",
      options: [
        { label: "Export Entire Song", value: "full", style: "primary" },
        { label: "Export Recorded Portion Only", value: "recorded", style: "secondary" }
      ]
    });
    if (!mode) return;
    track('Exported Final Audio', { mode });

    exportMix({
      ...mixSettings,
      trackVolume: effectiveTrackVolume,
      vocalVolume: effectiveVocalVolume,
      exportMode: mode as 'full' | 'recorded'
    }).then((blob: Blob | null) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'karaoke_mix.mp3';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    });
  };

  const handleStopClick = () => {
    if (isRecording) handleStopRecording();
    if (isPlaying) stopPreview();
    setCurrentTime(0); // Reset playhead when stopped
    setIsSyncSessionActive(false); // Gracefully exit sync mode on hard stop
  };

  const handlePlayPauseClick = () => {
    if (isRecording) return; // Cannot preview while recording
    if (isPlaying) {
      if (audioRef.current && isVideo) audioRef.current.pause();
      stopPreview();
    } else {
      handlePlayPreviewClick();
    }
  };

  const handleLineUpdate = (id: string, newStart: number | null, newEnd: number | null) => {
    setLyrics(prev => {
      const next = [...prev];
      const idx = next.findIndex(l => l.id === id);
      if (idx === -1) return prev;

      if (newStart === null || newEnd === null) {
        next[idx] = { ...next[idx], start: null, end: null };
        return next;
      }

      let adjustedStart = newStart;
      let adjustedEnd = newEnd;
      
      let prevStart = null;
      let nextStart = null;
      let prevIdx = -1;
      
      // Find the closest placed line BEFORE this one
      for (let i = idx - 1; i >= 0; i--) {
        if (next[i].start !== null) {
          prevStart = next[i].start as number;
          prevIdx = i;
          break;
        }
      }
      
      // Find the closest placed line AFTER this one
      for (let i = idx + 1; i < next.length; i++) {
        if (next[i].start !== null) {
          nextStart = next[i].start as number;
          break;
        }
      }

      // 1. STRICT CHRONOLOGICAL CONSTRAINT: Cannot start before previous placed line
      if (prevStart !== null && adjustedStart <= prevStart) {
        adjustedStart = prevStart + 0.1;
      }

      // 2. STRICT CHRONOLOGICAL CONSTRAINT: Cannot start after next placed line
      if (nextStart !== null && adjustedStart >= nextStart) {
        adjustedStart = nextStart - 0.2;
      }

      // 3. Prevent inversion and maintain minimum duration
      if (adjustedStart >= adjustedEnd - 0.1) {
        adjustedEnd = adjustedStart + 0.1;
      }

      // 4. PREVENT OVERLAP (Optional but clean): 
      if (nextStart !== null && adjustedEnd > nextStart) {
        adjustedEnd = nextStart;
        if (adjustedStart >= adjustedEnd - 0.1) {
           adjustedStart = adjustedEnd - 0.1;
        }
      }

      // 5. Do not let this line's start bleed before the closest previous line's end
      if (prevIdx >= 0 && next[prevIdx].end !== null) {
        const prevEnd = next[prevIdx].end as number;
        if (adjustedStart < prevEnd) {
           // Push the previous line's end back to make room
           next[prevIdx] = { ...next[prevIdx], end: adjustedStart };
        }
      }

      next[idx] = { ...next[idx], start: adjustedStart, end: adjustedEnd };

      return next;
    });
  };

  const triggerSyncTap = () => {
    setIsSpacebarDown(true);
    setTimeout(() => setIsSpacebarDown(false), 150);
    
    setLyrics(prev => {
       const next = [...prev];
       const currIdx = activeLineIndex;
       
       if (currIdx < next.length) {
          next[currIdx] = { ...next[currIdx], start: currentTime };
       }
       if (currIdx > 0 && currIdx <= next.length) {
          next[currIdx - 1] = { ...next[currIdx - 1], end: currentTime };
       }
       return next;
    });
    
    if (activeLineIndex <= lyrics.length) {
      setActiveLineIndex(idx => idx + 1);
    }
  };

  // Spacebar Logic (Tap to advance)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow spacebar if not typing in an input
      if (e.code === "Space" && e.target instanceof Element && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA" && activeTab === "SYNC") {
        e.preventDefault();
        if (e.repeat) return;
        if (isSyncSessionActive && isPlaying) {
          triggerSyncTap();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeLineIndex, activeTab, currentTime, lyrics.length, isSyncSessionActive, isPlaying]);

  const hasSyncedLines = lyrics.some(l => l.start !== null);

  if (!trackFile) {
    return (
      <div id="top" className="flex-1 overflow-y-auto bg-background font-sans scroll-smooth h-full">
        <div className="flex flex-col items-center text-center animate-in fade-in duration-300 slide-in-from-bottom-2 max-w-2xl mx-auto p-4 min-h-screen justify-center">
          <div className="flex items-center gap-6 mb-12 text-sm font-bold tracking-widest text-secondary uppercase">
            <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="text-secondary hover:text-foreground transition-colors pb-1 flex items-center gap-2">How it works <span>↓</span></button>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-foreground">
            Karaoke Studio
          </h1>
          <p className="text-lg md:text-xl text-secondary mb-10 font-medium">
            Sing along, record your vocals, and mix them into a professional track
          </p>

          <label className="px-8 py-3 rounded-full bg-foreground text-background hover:opacity-90 hover:scale-105 active:scale-95 cursor-pointer transition-all font-bold text-sm shadow-xl">
            Browse my files
            <input type="file" accept=".mp3,.wav,.m4a,.aac,.ogg,.mp4,.webm" className="hidden" onChange={handleTrackUpload} />
          </label>
        </div>
        
        <div id="how-it-works" className="w-full max-w-4xl mx-auto p-8 bg-panel/30 border-t border-edge/20 rounded-t-3xl min-h-[60vh]">
          <h2 className="text-3xl font-black mb-12 text-center">How to use Karaoke Studio</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-panel rounded-2xl border border-edge/20 shadow-sm">
              <div className="w-12 h-12 bg-[#38bdf8]/10 text-[#38bdf8] rounded-full flex items-center justify-center font-bold text-xl mb-4">1</div>
              <h3 className="font-bold mb-2">Upload Track</h3>
              <p className="text-secondary text-sm">Upload your instrumental backing track or a karaoke video file.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-panel rounded-2xl border border-edge/20 shadow-sm">
              <div className="w-12 h-12 bg-[#38bdf8]/10 text-[#38bdf8] rounded-full flex items-center justify-center font-bold text-xl mb-4">2</div>
              <h3 className="font-bold mb-2">Sync Lyrics</h3>
              <p className="text-secondary text-sm">Upload a .LRC file or paste lyrics to sing along with on-screen prompts.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-panel rounded-2xl border border-edge/20 shadow-sm">
              <div className="w-12 h-12 bg-[#38bdf8]/10 text-[#38bdf8] rounded-full flex items-center justify-center font-bold text-xl mb-4">3</div>
              <h3 className="font-bold mb-2">Record & Mix</h3>
              <p className="text-secondary text-sm">Record your vocals using the studio mixer and download the final mixed track.</p>
            </div>

          </div>
          <div className="flex justify-center mt-12">
            <button onClick={() => document.getElementById("top")?.scrollIntoView({ behavior: "smooth" })} className="px-6 py-2 rounded-full bg-edge/20 hover:bg-edge/40 text-foreground text-sm font-bold transition-all flex items-center gap-2">
              ↑ Back to top
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Unified Dialog System */}
      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { dialog.resolve(dialog.type === "confirm" ? false : null); setDialog(null); }}>
          <div className="bg-panel p-6 rounded-2xl border border-edge/20 light:border-edge shadow-2xl max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-foreground mb-2">{dialog.title}</h3>
            {dialog.message && <p className="text-sm text-secondary mb-6">{dialog.message}</p>}
            
            {dialog.type === "confirm" && (
              <div className="flex gap-3 justify-end">
                <button onClick={() => { dialog.resolve(false); setDialog(null); }} className="px-4 py-2 text-secondary hover:text-foreground rounded-xl font-medium transition-colors">Cancel</button>
                <button onClick={() => { dialog.resolve(true); setDialog(null); }} className="px-4 py-2 bg-[#38bdf8] hover:bg-[#38bdf8]/80 text-black rounded-xl font-bold transition-colors">Confirm</button>
              </div>
            )}

            {dialog.type === "prompt" && (
              <form onSubmit={(e) => { e.preventDefault(); const val = (e.currentTarget.elements.namedItem('dialogInput') as HTMLInputElement).value; dialog.resolve(val); setDialog(null); }}>
                <input name="dialogInput" autoFocus defaultValue={dialog.defaultValue || ''} className="w-full bg-background border border-edge/20 light:border-edge text-foreground rounded-xl px-4 py-3 mb-4 outline-none focus:border-[#38bdf8]" />
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => { dialog.resolve(null); setDialog(null); }} className="px-4 py-2 text-secondary hover:text-foreground rounded-xl font-medium transition-colors">Cancel</button>
                  <button type="submit" className="px-4 py-2 bg-[#38bdf8] hover:bg-[#38bdf8]/80 text-black rounded-xl font-bold transition-colors">Save</button>
                </div>
              </form>
            )}

            {dialog.type === "options" && dialog.options && (
              <div className="flex flex-col gap-3">
                {dialog.options.map((opt: DialogOption) => (
                  <button key={opt.value} onClick={() => { dialog.resolve(opt.value); setDialog(null); }}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-colors text-left ${
                      opt.style === 'danger' ? 'bg-[#ef4444]/20 hover:bg-[#ef4444]/30 text-[#ef4444]' :
                      opt.style === 'primary' ? 'bg-[#38bdf8]/20 hover:bg-[#38bdf8]/30 text-[#38bdf8]' :
                      'bg-control hover:bg-control-hover text-foreground'
                    }`}>
                    {opt.label}
                  </button>
                ))}
                <button onClick={() => { dialog.resolve(null); setDialog(null); }} className="w-full mt-1 py-2 px-4 text-gray-400 hover:text-foreground rounded-xl font-medium transition-colors">Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="h-[100dvh] flex flex-col bg-background text-foreground font-sans relative overflow-hidden">
      {isCountingIn && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-auto">
          {countdown !== null && countdown > 0 && (
             <div className="text-8xl font-black text-white mb-4 animate-bounce drop-shadow-2xl">
               {countdown}
             </div>
          )}
          <div className="text-5xl font-black text-[#10b981] animate-pulse drop-shadow-[0_0_15px_rgba(16,185,129,0.8)] tracking-widest">
            GET READY...
          </div>
        </div>
      )}
      
      {isMounted && (
        <Joyride
        key={runTour ? 'running' : 'stopped'}
        steps={tourSteps}
        run={runTour}
        continuous={true}
        locale={{ last: "Finish", skip: "Skip", next: "Next", back: "Back" }}
        onEvent={handleJoyrideCallback}
        options={{
          primaryColor: '#0ea5e9',
          backgroundColor: theme === 'dark' ? '#161B22' : '#ffffff',
          textColor: theme === 'dark' ? '#fafafa' : '#0F172A',
          zIndex: 99999,
          showProgress: true,
          buttons: ['back', 'skip', 'primary']
        }}
      />
      )}


      {/* Mic Error Banner */}
      {micError && (
        <div className="absolute top-20 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[600px] bg-[#ef4444] text-white p-4 rounded-xl shadow-2xl z-50 animate-in slide-in-from-top-4">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-lg mb-1">Microphone Blocked 🎤</h3>
            <button onClick={() => window.location.reload()} className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-bold transition-colors">Reload Page</button>
          </div>
          <p className="text-sm whitespace-pre-wrap">{micError}</p>
        </div>
      )}

      {/* HEADER */}
      {trackFile && (
      <header className="shrink-0 flex flex-col md:flex-row md:items-center md:justify-between border-b border-edge/20 light:border-edge bg-panel pl-[72px] pr-3 py-2 md:px-8 md:py-0 md:h-14 gap-2 md:gap-0 shadow-sm z-10 overflow-hidden">
        
        {/* LEFT SIDE: Brand & Tabs */}
        <div className="flex items-center justify-between gap-3 md:gap-6 z-10">
          <h2 className="text-base md:text-lg font-black tracking-tighter text-foreground flex items-center gap-2">
            <Mic2 className="w-5 h-5 text-foreground" />
            <span className="hidden md:inline">KARAOKE STUDIO</span><span className="inline md:hidden">KARAOKE</span><span className="sr-only"> - Free Online Vocal Recorder & Audio Mixer</span>
          </h2>
          
          <div className="hidden md:block h-6 w-px bg-control" />
          
          {/* IMPORT LRC */}
          <div className="flex bg-seg-bg p-1 rounded-full border border-edge/20 light:border-edge">
            <button 
              onClick={() => document.getElementById('lrc-upload')?.click()}
              className="tour-step-3 px-3 md:px-5 py-1.5 rounded-full text-xs font-medium transition-all bg-seg-active text-foreground font-semibold shadow-sm hover:text-foreground flex items-center gap-2"
            >
              <FileText className="w-4 h-4 text-[#38bdf8]" />
              <span className="hidden md:inline">Import Lyrics (.LRC, .SRT, .VTT)</span><span className="md:hidden text-[10px]">Import</span>
            </button>
          </div>
        </div>

        {/* RIGHT SIDE: Transport & Actions */}
        <div className="flex flex-col md:flex-row items-center md:items-center gap-3 md:gap-6 w-full md:w-auto mt-2 md:mt-0 pb-2 md:pb-0">
          {/* Transport & Utilities Row on Mobile */}
          <div className="flex items-center justify-between md:justify-center w-full md:w-auto gap-2">
            {/* Transport Controls */}
            <div className="flex items-center gap-1.5 bg-transparent p-1.5 rounded-full border border-edge/20 light:border-edge overflow-x-auto hide-scrollbar">
              <button 
                onClick={handlePlayPauseClick} 
                disabled={!trackBuffer || isRecording}
                className={`px-4 py-2 rounded-full flex items-center justify-center gap-2 transition-all font-bold text-xs whitespace-nowrap ${
                  isPlaying
                    ? 'bg-[#10b981] text-white shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                    : 'bg-transparent text-[#10b981] hover:bg-control hover:text-[#10b981] disabled:opacity-50 disabled:pointer-events-none'
                }`}
                title="Play/Pause Preview"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                <span className="hidden md:inline">{isPlaying ? "PAUSE PREVIEW" : "PREVIEW MIX"}</span><span className="md:hidden">{isPlaying ? "PAUSE" : "PREVIEW"}</span>
              </button>

              <button 
                onClick={isRecording ? handleStopClick : handleStartRecording}
                disabled={isPlaying || !trackFile || activeTab === "SYNC"}
                className={`tour-step-2 px-4 py-2 rounded-full flex items-center justify-center gap-2 transition-all font-bold text-xs whitespace-nowrap ${
                  isRecording 
                    ? 'bg-transparent border-2 border-[#ef4444] text-[#ef4444] shadow-[0_0_15px_rgba(239,68,68,0.7)] animate-pulse' 
                    : 'bg-transparent text-[#ef4444] hover:bg-control hover:bg-[#ef4444]/10 disabled:opacity-50 disabled:pointer-events-none'
                }`}
                title="Record"
              >
                {isRecording ? <Square className="w-3 h-3 fill-current" /> : <div className="w-3 h-3 rounded-full bg-[#ef4444]" />}
                <span className="hidden md:inline">{isRecording ? "STOP RECORDING" : "START RECORDING"}</span><span className="md:hidden">{isRecording ? "STOP" : "RECORD"}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 shrink-0">

              <button 
                onClick={() => {
                  setRunTour(false);
                  setTimeout(() => setRunTour(true), 10);
                }}
                className="hidden md:flex w-10 h-10 shrink-0 rounded-full bg-transparent border border-edge/20 light:border-edge text-muted hover:text-foreground hover:bg-control flex items-center justify-center transition-colors font-bold text-sm"
                title="How to use this app"
              >
                ?
              </button>
              <button 
                onClick={handleNewSession}
                className="p-2 md:px-5 md:py-2 bg-transparent border border-red-500/30 text-red-500 hover:bg-red-500/10 rounded-full text-xs font-bold transition-all flex items-center gap-2"
                title="Clear all and start fresh"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Start Over</span>
              </button>
            </div>
          </div>

          <div className="hidden md:block h-6 w-px bg-control" />


        </div>

        {/* Hidden file inputs */}
      </header>
      )}

      {/* Hidden file inputs moved out of header so they still work when header is hidden */}
      <input type="file" accept=".mp3,.wav,.m4a,.aac,.ogg,.mp4,.webm,audio/mpeg,audio/wav,audio/aac,audio/ogg,video/mp4,video/webm" className="hidden" id="file-upload" onChange={handleTrackUpload} />
      <input type="file" accept=".lrc,.srt,.vtt" className="hidden" id="lrc-upload" onChange={handleLRCUpload} />

      {/* TIMELINE AREA */}
      <div className={`flex-1 min-h-0 ${activeTab === 'MIXER' ? 'p-3 md:p-8 overflow-y-auto' : 'p-2 md:p-4 lg:p-8 flex flex-col overflow-hidden min-h-0'}`}>
        {activeTab === 'MIXER' ? (
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* VIDEO PLAYER */}
            {isVideo && trackUrl && (
              <div className="w-full bg-black rounded-xl overflow-hidden shadow-sm flex items-center justify-center border border-edge/20 light:border-edge relative group">
                <video
                  ref={audioRef}
                  src={trackUrl}
                  playsInline
                  muted={!isRecording}
                  preload="auto"
                  className="w-full max-h-[50vh] md:max-h-[60vh] object-contain bg-black"
                  onEnded={() => {
                    if (isRecording) {
                      handleStopRecording();
                    }
                  }}
                  onLoadedData={() => {
                    if (audioRef.current && !isPlaying && !isRecording) {
                      audioRef.current.currentTime = 0;
                    }
                  }}
                />
              </div>
            )}
            
            {/* TELEPROMPTER */}
            <h2 className="sr-only">Lyrics Teleprompter & Sync</h2>
            {lyrics.some(l => l.start !== null) && (
              (() => {
                let currentIdx = -1;
                for (let i = lyrics.length - 1; i >= 0; i--) {
                  const lineStart = lyrics[i].start;
                  if (lineStart !== undefined && lineStart !== null && lineStart <= currentTime) {
                    currentIdx = i;
                    break;
                  }
                }
                const currentLine = currentIdx >= 0 ? lyrics[currentIdx] : null;
                const currentText = currentLine ? currentLine.text : "Get ready...";
                let nextText = "";
                for (let i = currentIdx + 1; i < lyrics.length; i++) {
                   if (lyrics[i].text.trim() !== "") {
                     nextText = lyrics[i].text;
                     break;
                   }
                }
                
                return (
                  <div className={`bg-panel border border-edge/20 light:border-edge rounded-xl p-4 md:p-8 md:p-12 flex flex-col items-center justify-center shadow-sm relative overflow-hidden transition-all ${showFullLyrics ? 'h-[500px]' : 'min-h-[200px] md:min-h-[260px]'}`}>
                    <button 
                      onClick={() => setShowFullLyrics(!showFullLyrics)}
                      className="absolute top-4 right-4 z-20 px-3 py-1.5 bg-control hover:bg-control-hover text-muted hover:text-foreground rounded-md text-xs font-medium transition-colors border border-edge/20 light:border-edge"
                    >
                      {showFullLyrics ? 'Collapse Lyrics' : 'View Full Lyrics'}
                    </button>
                    
                    {showFullLyrics ? (
                      <div className="w-full h-full overflow-y-auto custom-scrollbar px-4 py-8">
                        <div className="max-w-3xl mx-auto flex flex-col items-start">
                          {lyrics.map((line, idx) => {
                            const isCurrent = currentIdx === idx;
                            let progress = 0;
                            if (line.start !== null && currentTime >= line.start) {
                              if (isCurrent && line.end !== null) {
                                progress = Math.min(100, Math.max(0, ((currentTime - line.start) / (line.end - line.start)) * 100));
                              } else {
                                progress = 100;
                              }
                            }
                            
                            if (line.text.trim() === '') return <div key={line.id} className="h-4 w-full" />;
                            
                            return (
                              <div 
                                key={line.id} 
                                className={`mb-6 w-full ${isCurrent ? 'scale-105 origin-left' : 'opacity-70'} transition-all`}
                                ref={isCurrent ? (el) => el?.scrollIntoView({ behavior: 'smooth', block: 'center' }) : null}
                              >
                                <span
                                  className={`text-2xl md:text-3xl font-extrabold tracking-tight transition-all duration-200 block text-left ${isCurrent ? 'text-foreground drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]' : 'text-secondary'}`}
                                >
                                  {line.text}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap justify-center gap-x-2 z-10 w-full mt-4">
                          {currentLine ? (() => {
                            let progress = 0;
                            if (currentLine.start !== null && currentLine.end !== null && currentTime >= currentLine.start) {
                              if (currentTime >= currentLine.end) {
                                progress = 100;
                              } else {
                                progress = ((currentTime - currentLine.start) / (currentLine.end - currentLine.start)) * 100;
                              }
                            } else if (currentLine.start !== null && currentLine.end === null && currentTime >= currentLine.start) {
                              progress = 100;
                            }
                            
                            return (
                              <div className="relative inline-block text-center px-4 w-full">
                                <span 
                                  className={`text-3xl md:text-4xl md:text-5xl font-extrabold inline-block mx-1 leading-tight tracking-tight transition-all duration-200 ${progress > 0 ? 'text-foreground' : 'text-secondary'} drop-shadow-[0_0_12px_rgba(255,255,255,0.1)]`}
                                >
                                  {currentLine.text}
                                </span>
                              </div>
                            );
                          })() : (
                            <span className="text-3xl md:text-4xl md:text-5xl font-extrabold text-secondary text-center tracking-tight">
                              {currentText}
                            </span>
                          )}
                        </div>
                        <span className="text-base md:text-lg font-medium text-secondary text-center mt-4 md:mt-6">
                          {nextText}
                        </span>
                      </>
                    )}
                  </div>
                );
              })()
            )}

          
          <h2 className="sr-only">Audio Mixer, Reverb & Vocal Separation</h2>
          {/* MOBILE MIXER TOGGLE */}
          <div className="md:hidden w-full flex justify-center mt-2 mb-2">
            <button 
              onClick={() => setShowMobileMixer(!showMobileMixer)}
              className="w-full py-3 rounded-xl border border-edge/20 bg-panel text-secondary font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <Volume2 className="w-4 h-4" />
              {showMobileMixer ? "Hide Mixer Settings" : "Adjust Volumes & Echo"}
            </button>
          </div>

          <div className={`space-y-6 ${showMobileMixer ? 'block' : 'hidden md:block'}`}>
          {/* TRACK 1: BACKING TRACK */}
          <div className="tour-step-1 flex flex-col md:flex-row md:h-32 border border-edge/20 light:border-edge bg-panel rounded-xl overflow-hidden shadow-sm">
            <div className="w-full md:w-[320px] p-3 md:p-5 flex flex-col justify-center md:justify-between items-stretch gap-4 md:gap-3 border-b md:border-b-0 md:border-r border-edge/20 light:border-edge shrink-0 bg-panel">
              <div className="w-full flex flex-col gap-1 min-w-0">
                <div className="flex justify-between items-center w-full min-w-0">
                  <div className="flex items-center gap-2 overflow-hidden pr-2 min-w-0 shrink">
                    <span className="font-bold text-sm text-foreground truncate">🎵 Instrumental Track</span>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={async () => {
                         const ok = await showDialog({
                           title: "Remove Track?",
                           message: "Remove instrumental track?",
                           type: "confirm"
                         });
                         if(ok) {
                            if (isPlaying) handleStopClick();
                            setTrackFile(null);
                            setTrackUrl(null);
                            clearTrack();
                            clearTrackFromDB().catch(console.error);
                         }
                      }}
                      className="w-7 h-7 rounded-md border border-edge/20 text-secondary hover:text-[#ef4444] hover:border-[#ef4444]/30 hover:bg-[#ef4444]/10 transition-colors flex items-center justify-center"
                      title="Remove Track"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    {trackBuffer && (
                      <button 
                        onClick={handlePlayPauseClick} 
                        className={`w-6 h-6 rounded-xl border flex items-center justify-center transition-all ${
                          (isPlaying) || (isRecording && !isRecPaused)
                            ? 'bg-[#10b981] border-[#10b981] text-foreground shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                            : 'bg-transparent border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-foreground'
                        }`}
                        title="Play/Pause Mix"
                      >
                        {(isPlaying) || (isRecording && !isRecPaused) ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                      </button>
                    )}
                    <button 
                      onClick={() => setTrackMuted(!trackMuted)}
                      className={`w-6 h-6 rounded-xl border text-[10px] font-bold transition-all ${trackMuted ? 'bg-foreground border-[#38bdf8] text-background' : 'bg-transparent border-edge text-muted hover:border-[#38bdf8] hover:text-foreground'}`}
                    >
                      M
                    </button>
                  </div>
                </div>
                {trackFile && <span className="text-xs text-secondary font-medium truncate block">{trackFile.name}</span>}
                {trackBuffer && <span className="text-[11px] font-mono text-foreground mt-0.5 inline-block">{formatTime(currentTime)} / {formatTime(trackBuffer.duration)}</span>}
              </div>
              
              <div className="flex items-center gap-3">
                <Volume2 className={`w-4 h-4 ${trackMuted ? 'text-edge' : 'text-muted'}`} />
                <input 
                  type="range" min="0" max="200" 
                  value={mixSettings.trackVolume}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateSetting('trackVolume', val);
                    if (isPlaying && !trackMuted) {
                      setTrackVolumeLive(val);
                    }
                    if (audioRef.current) audioRef.current.volume = Math.min(val / 100, 1);
                  }}
                  className={`flex-1 h-1 rounded-full outline-none appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slider-thumb [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-foreground transition-opacity ${trackMuted ? 'opacity-50' : ''}`}
                  style={sliderFillStyle(mixSettings.trackVolume, 0, 200)}
                />
                <span className={`text-xs font-mono w-7 text-right ${trackMuted ? 'text-edge' : 'text-muted'}`}>{mixSettings.trackVolume}</span>
              </div>
            </div>
            
            <div className={`flex-1 relative h-32 md:h-auto bg-transparent transition-opacity ${trackMuted ? 'opacity-30' : 'opacity-100'}`}>
              {trackBuffer ? (
                <div className="tour-step-1-target w-full h-full">
                  <StaticWaveform 
                    buffer={trackBuffer} 
                    color={theme === 'dark' ? '#00E5FF' : '#0284C7'} 
                    duration={trackBuffer.duration} 
                    currentTime={currentTime} 
                    totalDuration={masterDuration}
                    onSeekStart={handleSeekStart} onSeekDrag={handleSeekDrag} onSeekEnd={handleSeekEnd}
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center min-h-[100px] p-4">
                  <button 
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="tour-step-1-target border-2 border-dashed border-edge/20 light:border-edge px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-medium text-secondary hover:bg-panel hover:border-[#38bdf8] hover:text-foreground transition-all w-full md:w-auto text-center"
                  >
                    Click to Load Instrumental Track
                  </button>
                  <input id="file-upload" type="file" accept=".mp3,.wav,.m4a,.aac,.ogg,.mp4,.webm,audio/mpeg,audio/wav,audio/aac,audio/ogg,video/mp4,video/webm" onChange={handleTrackUpload} className="hidden" />
                </div>
              )}
            </div>
          </div>

          {/* TRACK 2: VOCALS */}
          <div className="flex flex-col md:flex-row md:h-32 border border-edge/20 light:border-edge bg-panel rounded-xl overflow-hidden shadow-sm">
            <div className="w-full md:w-[320px] p-3 md:p-5 flex flex-col justify-center md:justify-between items-stretch gap-4 md:gap-3 border-b md:border-b-0 md:border-r border-edge/20 light:border-edge shrink-0 bg-panel">
              <div className="w-full flex flex-col gap-1 min-w-0">
                <div className="flex justify-between items-center w-full min-w-0">
                  <div className="flex items-center gap-2 overflow-hidden pr-2 min-w-0 shrink">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isRecording ? 'bg-[#ef4444] animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'bg-edge'}`} />
                    <span className="font-bold text-sm text-foreground truncate">🎤 Your Voice</span>
                    {(isPlaying || isRecording) && (
                      <div className="flex items-end gap-[2px] h-3 ml-1 shrink-0">
                        <div className="w-[3px] bg-[#F43F5E] animate-pulse h-full rounded-t-sm" />
                        <div className="w-[3px] bg-[#F59E0B] animate-pulse-2 h-full rounded-t-sm" style={{ animationDelay: '0.2s' }} />
                        <div className="w-[3px] bg-[#F43F5E] animate-pulse-3 h-full rounded-t-sm" style={{ animationDelay: '0.4s' }} />
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {vocalBuffer && (
                      <button 
                        onClick={async () => {
                           const ok = await showDialog({
                             title: "Delete Vocals?",
                             message: "Delete this vocal recording?",
                             type: "confirm"
                           });
                           if(ok) {
                              if (isPlaying) handleStopClick();
                              setRecordedBlob(null);
                              clearVocal();
                              clearVocalFromDB().catch(console.error);
                           }
                        }}
                        className="w-7 h-7 rounded-md border border-edge/20 text-secondary hover:text-[#ef4444] hover:border-[#ef4444]/30 hover:bg-[#ef4444]/10 transition-colors flex items-center justify-center"
                        title="Delete Vocals"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {vocalBuffer && (
                      <button 
                        onClick={handlePlayPauseClick} 
                        className={`w-6 h-6 rounded-xl border flex items-center justify-center transition-all ${
                          (isPlaying) || (isRecording && !isRecPaused)
                            ? 'bg-[#10b981] border-[#10b981] text-foreground shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:scale-110'
                            : 'bg-transparent border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-foreground hover:scale-110'
                        }`}
                        title="Play/Pause Mix"
                      >
                        {(isPlaying) || (isRecording && !isRecPaused) ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                      </button>
                    )}
                    <button 
                      onClick={() => setVocalMuted(!vocalMuted)}
                      className={`w-6 h-6 rounded-xl border flex items-center justify-center transition-all ${vocalMuted ? 'bg-[#ef4444] border-[#ef4444] text-foreground shadow-[0_0_10px_rgba(239,68,68,0.3)] hover:scale-110' : 'bg-transparent border-edge text-secondary hover:text-foreground hover:border-secondary hover:scale-110'}`}
                      title={vocalMuted ? "Unmute Vocals" : "Mute Vocals"}
                    >
                      M
                    </button>
                  </div>
                </div>
                {vocalBuffer && <span className="text-[11px] font-mono text-[#fb7185] mt-0.5 inline-block">{formatTime(currentTime)} / {formatTime(vocalBuffer.duration)}</span>}
              </div>
              
              <div className="flex items-center gap-3">
                <Mic2 className={`w-4 h-4 ${vocalMuted ? 'text-edge' : 'text-muted'}`} />
                <input 
                  type="range" min="0" max="200" 
                  value={mixSettings.vocalVolume}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    updateSetting('vocalVolume', val);
                    if (isPlaying && !vocalMuted) {
                      setVocalVolumeLive(val);
                    }
                  }}
                  className={`flex-1 h-1 rounded-full outline-none appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-slider-thumb [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-foreground transition-opacity ${vocalMuted ? 'opacity-50' : ''}`}
                  style={sliderFillStyle(mixSettings.vocalVolume, 0, 200)}
                />
                <span className={`text-xs font-mono w-7 text-right ${vocalMuted ? 'text-edge' : 'text-muted'}`}>{mixSettings.vocalVolume}</span>
              </div>
            </div>
            
            <div className={`flex-1 relative h-32 md:h-auto bg-transparent transition-opacity ${vocalMuted ? 'opacity-30' : 'opacity-100'}`}>
              {isRecording ? (
                <div className="absolute inset-0">
                  <canvas ref={canvasRef} className="w-full h-full" />
                </div>
              ) : vocalBuffer ? (
                <StaticWaveform 
                  buffer={vocalBuffer} 
                  color={theme === 'dark' ? '#8B5CF6' : '#a855f7'} 
                  duration={vocalBuffer.duration} 
                  currentTime={currentTime}
                  totalDuration={masterDuration}
                  onSeekStart={handleSeekStart} onSeekDrag={handleSeekDrag} onSeekEnd={handleSeekEnd}
                />
              ) : (
                <StaticWaveform 
                  buffer={null} 
                  color={theme === 'dark' ? '#8B5CF6' : '#a855f7'} 
                  duration={0} 
                  currentTime={0} 
                  emptyText="Ready to Record"
                />
              )}
            </div>
          </div>

          {/* MASTER BUS SETTINGS (Docked at bottom) */}
          <div className="p-4 md:p-6 bg-panel border border-edge/20 light:border-edge rounded-xl flex flex-col md:flex-row gap-6 md:gap-8 shadow-sm">
            <div className="flex-1">
              <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                ⏱️ Sync & Mic Delay
              </h3>
              <div className="flex items-center gap-3 md:gap-4">
                <span className="text-sm font-medium text-muted w-20 md:w-24">Delay Offset</span>
                <input 
                  type="range" min="-300" max="300" 
                  value={mixSettings.latencyOffsetMs}
                  onChange={(e) => updateSetting('latencyOffsetMs', Number(e.target.value))}
                  className="flex-1 h-1 rounded-full outline-none appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-slider-thumb [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-foreground"
                  style={sliderFillStyle(mixSettings.latencyOffsetMs, -300, 300)}
                />
                <span className="text-sm font-mono font-medium text-foreground w-12 md:w-14 text-right">{mixSettings.latencyOffsetMs}ms</span>
              </div>
              <span className="text-xs font-medium text-secondary mt-1.5 mb-5 block">
                Nudge timing backward or forward if your Bluetooth mic or headphones have delay.
              </span>

              <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                <span className="text-sm font-medium text-muted w-20 md:w-24">Count-in (4 beats)</span>
                <button 
                  onClick={() => updateSetting("countInEnabled", !mixSettings.countInEnabled)}
                  className={`px-3 py-1 text-xs font-bold rounded-full border transition-all ${mixSettings.countInEnabled ? "bg-[#10b981]/20 border-[#10b981] text-[#10b981]" : "border-edge/20 light:border-edge text-muted hover:text-foreground"}`}
                >
                  {mixSettings.countInEnabled ? "Enabled" : "Disabled"}
                </button>
                {mixSettings.countInEnabled && (
                  <>
                    <input 
                      type="number" min="40" max="240" 
                      value={mixSettings.bpm || 120}
                      onChange={(e) => updateSetting("bpm", Number(e.target.value))}
                      className="w-16 bg-control border border-edge/20 light:border-edge text-foreground rounded text-center text-xs font-mono h-7"
                    />
                    <span className="text-xs text-secondary font-medium -ml-2">BPM</span>
                  </>
                )}
              </div>
              <span className="text-xs font-medium text-secondary mt-1.5 block">
                Plays a 4-beat click before recording starts so you can catch the beat.
              </span>

            </div>
            
            <div className="flex-1 md:border-l border-edge/20 light:border-edge md:pl-8 pt-6 md:pt-0 border-t md:border-t-0">
              <h3 className="text-xs font-bold text-secondary uppercase tracking-wider mb-4 flex items-center gap-2">
                🎛️ Master Effects
              </h3>
              <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${mixSettings.reverbEnabled ? 'bg-[#8B5CF6]/10 border-[#8B5CF6]/50 shadow-[0_0_15px_rgba(139,92,246,0.15)]' : 'bg-transparent border-edge/20 light:border-edge'}`}>
                <span className={`text-sm font-bold ${mixSettings.reverbEnabled ? 'text-[#8B5CF6] drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]' : 'text-foreground'}`}>Studio Reverb (Vocals)</span>
                <button 
                  onClick={() => updateSetting('reverbEnabled', !mixSettings.reverbEnabled)}
                  className={`w-14 h-7 rounded-full transition-all relative border-2 flex items-center shadow-inner ${mixSettings.reverbEnabled ? 'bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4] border-transparent shadow-[0_0_15px_rgba(139,92,246,0.6)]' : 'bg-control border-edge'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-foreground transition-all shadow-md transform ${mixSettings.reverbEnabled ? 'translate-x-7 scale-110 drop-shadow-[0_0_5px_white]' : 'translate-x-0.5'}`} />
                </button>
              </div>
              <span className="text-xs font-medium text-secondary mt-3 block">
                Adds a professional studio echo to your voice when exporting.
              </span>
              <div className="flex items-center gap-4 mt-6">
              </div>

            </div>
          </div>

          </div>
          {/* Export Audio Button - At bottom of Mixer */}
          <div className="flex justify-center mt-4 mb-6 md:mb-2 shrink-0">
            <button
              onClick={handleExportClick}
              disabled={isProcessing || !recordedBlob}
              className="tour-step-4 w-full md:w-auto px-12 py-3 bg-foreground text-background hover:scale-[1.02] active:scale-[0.98] rounded-full text-base font-bold transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg"
            >
              {isProcessing ? 'Processing Mix...' : 'Export Final Audio'}
            </button>
          </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 bg-transparent overflow-hidden gap-3">
            {lyrics.length === 0 ? (
              <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full pt-8">
                <label className="text-sm font-bold text-muted mb-2">Paste Lyrics</label>
                <textarea
                  value={rawLyricsText}
                  onChange={e => setRawLyricsText(e.target.value)}
                  className="flex-1 bg-panel text-input-text p-4 rounded-xl border border-edge/20 light:border-edge focus:outline-none focus:border-[#38bdf8] resize-none"
                  placeholder="Paste lyrics here..."
                />
                <button 
                  onClick={() => {
                    const lines = rawLyricsText.split('\n').map(l => l.trim()).filter(l => l);
                    setLyrics(lines.map((text, idx) => ({ id: `line-${Date.now()}-${idx}`, text, start: null, end: null })));
                  }}
                  className="w-full mt-4 py-3 bg-foreground text-background rounded font-bold hover:bg-[#0ea5e9] transition-colors"
                >
                  Generate Timeline
                </button>
              </div>
            ) : activeTab === "SYNC" ? (
              <div className="flex-1 flex flex-col h-full gap-4 min-h-0">
                <div className="shrink-0 flex flex-col items-center justify-center py-4 border border-edge/20 light:border-edge rounded-xl bg-panel shadow-sm">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0 w-full max-w-5xl px-4 ml-auto mr-auto">
                    {/* Left: Secondary Actions (Empty) */}
                    <div className="hidden md:flex items-center gap-3 w-1/3 justify-start">
                    </div>

                    {/* Center: Primary Sync Actions */}
                    <div className="flex items-center justify-center gap-3 w-full md:w-1/3 whitespace-nowrap flex-wrap">
                      <button 
                        onClick={(e) => { 
                          e.currentTarget.blur(); 
                          if (isPlaying) {
                            if (isSyncSessionActive) {
                              triggerSyncTap();
                            } else {
                              stopPreview();
                            }
                          } else {
                            if (isSyncSessionActive) {
                              startPlayback(currentTime);
                            } else {
                              if (hasSyncedLines) {
                                if (currentTime === 0) {
                                  if (audioRef.current) audioRef.current.currentTime = 0;
                                  setActiveLineIndex(0);
                                }
                                startPlayback(currentTime);
                              } else {
                                setIsSyncSessionActive(true);
                                if (audioRef.current) audioRef.current.currentTime = 0;
                                setCurrentTime(0);
                                setActiveLineIndex(0);
                                startPlayback(0);
                              }
                            }
                          }
                        }}
                        disabled={!trackUrl}
                        className={`flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 rounded-full font-bold text-sm transition-transform hover:scale-105 ${isPlaying && isSyncSessionActive ? 'bg-red-500 text-foreground' : isPlaying && !isSyncSessionActive ? 'bg-amber-500 text-black' : 'bg-foreground text-background'} disabled:opacity-50 min-w-[160px] md:min-w-[200px]`}
                      >
                        {isPlaying 
                          ? (isSyncSessionActive ? 'Tap Spacebar to Sync' : '⏸ Stop Review') 
                          : (isSyncSessionActive 
                              ? '▶ Resume Syncing' 
                              : (hasSyncedLines 
                                  ? (currentTime > 0 ? '▶ Resume Review' : '▶ Review Sync') 
                                  : '▶ Start Syncing')
                            )
                        }
                      </button>

                      {isSyncSessionActive && (
                        <button 
                          onClick={(e) => {
                            e.currentTarget.blur();
                            if (isPlaying) stopPreview();
                            setIsSyncSessionActive(false);
                          }}
                          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1ed760] hover:bg-[#1db954] text-black rounded-full font-bold text-sm transition-colors"
                        >
                          ✓ Finish
                        </button>
                      )}
                    </div>

                    {/* Right: Danger Actions (Clear/Restart) */}
                    <div className="flex items-center gap-3 w-full md:w-1/3 justify-center md:justify-end whitespace-nowrap flex-wrap">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          e.currentTarget.blur();
                          if (isPlaying) stopPreview();
                          if (audioRef.current) {
                            audioRef.current.pause();
                            audioRef.current.currentTime = 0;
                          }
                          setCurrentTime(0);
                          setActiveLineIndex(0);
                          setLyrics(prev => prev.map(l => ({ ...l, start: null, end: null })));
                          setIsSyncSessionActive(false);
                        }}
                        disabled={!hasSyncedLines && currentTime === 0}
                        className="px-4 py-2.5 bg-transparent text-foreground/70 hover:text-foreground text-xs font-medium rounded-full hover:bg-control transition-colors border border-edge/20 light:border-edge disabled:opacity-30"
                      >
                        🔄 Restart Sync
                      </button>
                      <button onClick={async (e) => { 
                        e.stopPropagation(); 
                        const ok = await showDialog({
                          title: "Wipe Lyrics?",
                          message: "Wipe out all lyrics entirely? This cannot be undone.",
                          type: "confirm"
                        });
                        if (ok) {
                          if (isPlaying) stopPreview();
                          if (audioRef.current) {
                            audioRef.current.pause();
                            audioRef.current.currentTime = 0;
                          }
                          setCurrentTime(0);
                          setLyrics([]); 
                          setRawLyricsText('');
                          setActiveLineIndex(0); 
                          setIsSpacebarDown(false); 
                          setIsSyncSessionActive(false);
                        }
                      }} className="px-4 py-2.5 bg-transparent hover:bg-red-500/10 text-red-500 text-xs font-medium rounded-full transition-colors border border-red-500/30">
                        Clear All Lyrics
                      </button>
                    </div>
                  </div>
                </div>
                <div 
                  className={`flex-1 overflow-y-auto custom-scrollbar bg-panel rounded-xl border border-edge/20 light:border-edge p-4 md:p-8 flex flex-col items-center relative transition-colors select-none ${isSpacebarDown ? 'border-[#38bdf8] bg-edge/15 light:bg-slate-100' : ''}`}
                >
                   {lyrics.length === 0 ? (
                     <div className="flex flex-col items-center justify-center h-full text-center max-w-md">
                       <h3 className="text-xl font-bold text-foreground mb-2">No Lyrics Yet</h3>
                       <p className="text-muted mb-6">Upload an LRC file or type your lyrics in the Editor tab first.</p>
                       <button onClick={() => setActiveTab("EDIT")} className="px-6 py-2 bg-foreground text-background rounded-full font-bold shadow-[0_0_15px_rgba(56,189,248,0.3)] hover:bg-[#0ea5e9] transition-colors">Go to Editor</button>
                     </div>
                   ) : (
                     lyrics.map((line, idx) => {
                       const isSynced = line.start !== null;
                       const currentlyPlayingIdx = lyrics.findIndex(l => 
                         l.start !== null && currentTime >= l.start && (l.end === null || currentTime < l.end)
                       );
                       // During an active sync session, the current line is the one whose start was
                       // just tapped (activeLineIndex - 1). Before the first tap nothing is current.
                       // During review, only highlight the line that is actually playing; if the
                       // audio hasn't reached any recorded line yet, don't highlight anything.
                       const glowIndex = isSyncSessionActive ? activeLineIndex - 1 : currentlyPlayingIdx;
                       const isTarget = glowIndex === idx;
                      
                      // During an active sync, don't auto-highlight lines we haven't reached yet, even if they have old timestamps
                      const isSung = isSynced && (currentTime >= line.start!) && (!isSyncSessionActive || idx < activeLineIndex);
                      
                      // Unsynced lines are dim gray during sync session, otherwise normal text color
                      let textColor = 'var(--lyric-inactive)';
                      if (isSung || (isTarget && (isSyncSessionActive || isPlaying))) textColor = 'var(--foreground)';
                      else if (!isSyncSessionActive && !isSynced) textColor = 'var(--foreground)';

                      const isLastSyncedLine = isSynced && (idx === lyrics.length - 1 || lyrics[idx + 1].start === null);
                      const showResumeShortcut = !isSyncSessionActive && isLastSyncedLine && idx < lyrics.length - 1;

                      return (
                        <div key={line.id} className="flex flex-col mb-8 relative w-full max-w-2xl">
                          <div 
                            ref={isTarget && (isSyncSessionActive || isPlaying) ? (el) => {
                              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            } : null}
                            onClick={() => {
                              // Punch-in edit
                              if (line.start !== null) {
                                setCurrentTime(line.start);
                                if (audioRef.current) audioRef.current.currentTime = line.start;
                                setActiveLineIndex(idx + 1);
                                if (isPlaying || isSyncSessionActive) {
                                  startPlayback(line.start);
                                }
                              } else {
                                // Clicked unsynced line
                                setActiveLineIndex(idx);
                              }
                            }}
                            className={`flex items-start justify-start gap-4 transition-all cursor-pointer hover:scale-105 origin-left ${isTarget && (isSyncSessionActive || isPlaying) ? 'scale-110 drop-shadow-md' : 'opacity-70 hover:opacity-100'}`} 
                          >
                            {/* Sleek active indicator bar */}
                            <div className={`w-1.5 h-8 mt-1.5 rounded-full shrink-0 transition-all ${isTarget && (isSyncSessionActive || isPlaying) ? 'bg-[#1db954] opacity-100 shadow-[0_0_10px_#1db954]' : 'bg-transparent opacity-0'}`} />
                            
                            <div 
                              className="text-2xl md:text-4xl font-bold transition-colors duration-200 flex items-start justify-start gap-4 flex-1"
                              style={{ color: textColor }}
                            >
                              <span className="text-xl md:text-2xl font-mono opacity-50 shrink-0 w-8 text-right mt-1.5">{idx + 1}.</span>
                              <span className="flex-1 text-left leading-tight">{line.text}</span>
                            </div>
                          </div>
                          
                          {showResumeShortcut && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveLineIndex(idx + 1);
                                setIsSyncSessionActive(true);
                                const startTime = line.end || line.start || currentTime;
                                setCurrentTime(startTime);
                                if (audioRef.current) audioRef.current.currentTime = startTime;
                                startPlayback(startTime);
                              }}
                              className="mt-4 flex items-center gap-2 px-4 py-2 bg-[#10b981]/20 hover:bg-[#10b981]/30 text-[#10b981] rounded-full text-xs font-bold transition-colors"
                            >
                              ▶ Resume Syncing From Here
                            </button>
                          )}
                        </div>
                      );
                   }))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full min-h-0">
                <div className="text-center text-xs md:text-sm font-bold text-secondary py-2 mb-2 px-2">
                  Drag the blocks or the left/right handles to fine-tune the timing.
                </div>
                <div className="flex-1 shrink-0 bg-transparent rounded-xl border border-edge/20 light:border-edge">
                  <WaveformEditor trackUrl={trackUrl!} lyrics={lyrics} onUpdateLine={handleLineUpdate} theme={theme} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hidden audio element for synchronized playback DURING recording */}
      {trackUrl && !isVideo && (
        <audio 
          ref={audioRef} 
          src={trackUrl} 
          onEnded={() => {
            if (isRecording) {
              handleStopRecording();
            }
          }}
        />
      )}
    </div>
    </>
  );
}
