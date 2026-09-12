"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Upload, Play, Pause, Square, Music, 
  Download, FileText, RotateCcw, Trash2, ChevronRight 
} from "lucide-react";
import { useAudioMixer } from "@/hooks/useAudioMixer";
import { useTheme } from "@/hooks/useTheme";
import WaveformEditor from "@/components/shared/WaveformEditor";

export type LineSync = { id: string; text: string; start: number | null; end: number | null; };

export function LyricsSyncTool() {
  const { loadTrack, trackBuffer } = useAudioMixer();
  const { theme } = useTheme();

  const [trackFile, setTrackFile] = useState<File | null>(null);
  const [trackUrl, setTrackUrl] = useState<string | null>(null);
  const [rawLyricsText, setRawLyricsText] = useState("");
  const [lyrics, setLyrics] = useState<LineSync[]>([]);
  const [activeLineIndex, setActiveLineIndex] = useState(0);
  const [isSyncSessionActive, setIsSyncSessionActive] = useState(false);
  const [isSpacebarDown, setIsSpacebarDown] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeView, setActiveView] = useState<"SYNC" | "EDIT">("SYNC");
  const [isPlayingLocal, setIsPlayingLocal] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number | null>(null);

    // Directly compute duration from the known trackBuffer without reading the volatile audioRef during render
  const duration = trackBuffer?.duration || 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${m}:${s.toString().padStart(2, '0')}.${ms}`;
  };

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
    const baseName = trackFile?.name.replace(/\.(mp3|wav|ogg|m4a|flac)$/i, '') || 'lyrics';
    a.download = `${baseName}.lrc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const triggerSyncTap = useCallback(() => {
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
  }, [activeLineIndex, currentTime, lyrics.length]);

  const handleTrackUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTrackFile(file);
      const url = URL.createObjectURL(file);
      setTrackUrl(url);
      await loadTrack(file);
    }
  };

  const handleLRCUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
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
                
                const h2 = parseInt(timeMatch[5] || '0', 10);
                const m2 = parseInt(timeMatch[6], 10);
                const s2 = parseInt(timeMatch[7], 10);
                const ms2 = parseInt(timeMatch[8], 10);
                const end = h2 * 3600 + m2 * 60 + s2 + ms2 / 1000;
                
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
                    end: end
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
      };
      reader.readAsText(file);
    }
  };



  const updateTime = useCallback(function updateTimeFrame() {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
    if (isPlayingLocal) {
      animationRef.current = requestAnimationFrame(updateTimeFrame);
    }
  }, [isPlayingLocal]);

  useEffect(() => {
    if (isPlayingLocal) {
      animationRef.current = requestAnimationFrame(updateTime);
    } else {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlayingLocal, updateTime]);

  const startPlayback = (offset = 0) => {
    if (audioRef.current) {
      audioRef.current.currentTime = offset;
      audioRef.current.play().then(() => {
        setIsPlayingLocal(true);
      }).catch(err => {
        console.error("Playback failed", err);
        setIsPlayingLocal(false);
        setIsSyncSessionActive(false);
      });
    }
  };

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setIsPlayingLocal(false);
      setIsSyncSessionActive(false);
      setActiveLineIndex(0);
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlayingLocal) {
      audioRef.current.pause();
      setIsPlayingLocal(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingLocal(true);
      }).catch(err => {
        console.error("Playback failed", err);
        setIsPlayingLocal(false);
        setIsSyncSessionActive(false);
      });
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

      const adjustedStart = Math.max(0, newStart);
      const adjustedEnd = Math.max(adjustedStart + 0.1, newEnd);
      // Enforce non-overlap with neighbors
      if (idx > 0 && next[idx - 1].start !== null) {
        const prevEnd = next[idx - 1].end as number;
        if (adjustedStart < prevEnd) {
          next[idx - 1] = { ...next[idx - 1], end: adjustedStart };
        }
      }
      next[idx] = { ...next[idx], start: adjustedStart, end: adjustedEnd };
      return next;
    });
  };

  const handleClearAll = () => {
    setLyrics([]);
    setRawLyricsText("");
    setActiveLineIndex(0);
    setCurrentTime(0);
    setIsSyncSessionActive(false);
    setIsSpacebarDown(false);
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" && e.target instanceof Element && 
          e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA" &&
          activeView === "SYNC") {
        e.preventDefault();
        if (e.repeat) return;
        
        if (isSyncSessionActive && isPlayingLocal) {
          triggerSyncTap();
        } else if (!isSyncSessionActive) {
          togglePlayPause();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLineIndex, activeView, currentTime, lyrics.length, isSyncSessionActive, isPlayingLocal, triggerSyncTap]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const handleEnded = () => {
      setIsPlayingLocal(false);
      setIsSyncSessionActive(false);
    };
    audio.addEventListener('ended', handleEnded);
    return () => audio.removeEventListener('ended', handleEnded);
  }, []);

  const handleGenerateTimeline = () => {
    if (!rawLyricsText.trim()) return;
    const newLines = rawLyricsText.split('\n')
      .map(line => line.trim())
      .filter(line => line !== '')
      .map(line => ({
        id: "line-" + Date.now() + "-" + Math.random(),
        text: line,
        start: null,
        end: null
      } as LineSync));
    setLyrics(newLines);
  };

  const startSyncSession = () => {
    setIsSyncSessionActive(true);
    setActiveLineIndex(0);
    // Clear existing timestamps
    setLyrics(prev => prev.map(l => ({ ...l, start: null, end: null })));
    if (!isPlayingLocal) {
      startPlayback(0);
    } else if (audioRef.current) {
      audioRef.current.currentTime = 0;
    }
  };

  // Auto-scroll active line
  useEffect(() => {
    if (activeView === "SYNC") {
      const activeEl = document.getElementById(`sync-line-${activeLineIndex}`);
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLineIndex, activeView]);


  // --------------------------------------------------------------------------
  // Views
  // --------------------------------------------------------------------------

  // State 1: No Audio Loaded
  if (!trackUrl) {
    return (
      <div className="flex-1 h-full w-full flex flex-col items-center bg-background font-sans overflow-y-auto scroll-smooth">
        <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500 max-w-2xl mx-auto p-4 min-h-screen justify-center">
          <div className="flex items-center gap-6 mb-12 text-sm font-bold tracking-widest text-secondary uppercase">
            <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="text-secondary hover:text-foreground transition-colors pb-1 flex items-center gap-2">How it works <span>↓</span></button>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-foreground">
            Lyrics Sync Tool
          </h1>
          <p className="text-lg md:text-xl text-secondary mb-10 font-medium">
            Sync lyrics to any audio track and export as .lrc
          </p>

          <label className="px-8 py-3 rounded-full border border-edge/40 hover:bg-control cursor-pointer transition-colors text-foreground font-semibold text-sm shadow-sm backdrop-blur-sm">
            Browse my files
            <input type="file" accept=".mp3,.wav,.m4a,.aac,.ogg,.mp4,.webm" className="hidden" onChange={handleTrackUpload} />
          </label>
        </div>
        <div id="how-it-works" className="w-full max-w-4xl mx-auto mt-12 p-8 bg-panel/30 border-t border-edge/20 rounded-t-3xl">
          <h2 className="text-3xl font-black mb-12 text-center">How to use Lyrics Sync</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-panel rounded-2xl border border-edge/20 shadow-sm">
              <div className="w-12 h-12 bg-[#38bdf8]/10 text-[#38bdf8] rounded-full flex items-center justify-center font-bold text-xl mb-4">1</div>
              <h3 className="font-bold mb-2">Upload Song</h3>
              <p className="text-secondary text-sm">Select any audio track, then paste the raw un-synced text of the lyrics into the editor.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-panel rounded-2xl border border-edge/20 shadow-sm">
              <div className="w-12 h-12 bg-[#38bdf8]/10 text-[#38bdf8] rounded-full flex items-center justify-center font-bold text-xl mb-4">2</div>
              <h3 className="font-bold mb-2">Tap to Sync</h3>
              <p className="text-secondary text-sm">Play the audio, and press the Spacebar exactly when the singer sings each line to record the timestamps.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-panel rounded-2xl border border-edge/20 shadow-sm">
              <div className="w-12 h-12 bg-[#38bdf8]/10 text-[#38bdf8] rounded-full flex items-center justify-center font-bold text-xl mb-4">3</div>
              <h3 className="font-bold mb-2">Export .LRC</h3>
              <p className="text-secondary text-sm">Fine-tune any mistakes in the timeline view, then export as a standard .lrc file for Karaoke apps.</p>
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

  // State 2: Audio Loaded, No Lyrics
  if (lyrics.length === 0) {
    return (
      <div className="h-full w-full flex flex-col bg-background text-foreground">
        {/* Header */}
        <header className="flex-none pl-[72px] pr-4 py-4 border-b border-edge/20 bg-panel flex items-center justify-between">
          <div className="flex items-center gap-2 font-medium">
            <Music className="w-5 h-5 text-secondary" />
            <span className="truncate max-w-[200px] sm:max-w-md">{trackFile?.name || "Audio Track"}</span>
          </div>
          <label className="cursor-pointer text-sm text-secondary hover:text-foreground transition-colors flex items-center gap-1 bg-control px-3 py-1.5 rounded-md border border-edge/20">
            <input type="file" accept=".mp3,.wav,.m4a,.aac,.ogg,.mp4,.webm,audio/mpeg,audio/wav,audio/aac,audio/ogg,video/mp4,video/webm" className="hidden" onChange={handleTrackUpload} />
            Change File
          </label>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center">
          <div className="w-full max-w-2xl space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Paste your lyrics below</h2>
              <p className="text-sm text-secondary">Make sure each line is separated by a new line.</p>
            </div>
            
            <textarea
              className="w-full h-64 bg-panel border border-edge/20 rounded-xl p-4 text-foreground focus:outline-none focus:border-edge/50 resize-none transition-colors"
              placeholder="Paste lyrics here..."
              value={rawLyricsText}
              onChange={(e) => setRawLyricsText(e.target.value)}
            />

            <div className="flex flex-col items-center gap-4 pt-2">
              <button
                onClick={handleGenerateTimeline}
                disabled={!rawLyricsText.trim()}
                className="bg-foreground text-background px-8 py-3 rounded-full font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Generate Timeline
              </button>


            </div>
          </div>
        </div>

        {/* Hidden Audio Element */}
        {trackUrl && <audio ref={audioRef} src={trackUrl} />}
        <div id="how-it-works" className="w-full max-w-4xl mx-auto mt-12 p-8 bg-panel/30 border-t border-edge/20 rounded-t-3xl">
          <h2 className="text-3xl font-black mb-12 text-center">How to use Lyrics Sync</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-panel rounded-2xl border border-edge/20 shadow-sm">
              <div className="w-12 h-12 bg-[#38bdf8]/10 text-[#38bdf8] rounded-full flex items-center justify-center font-bold text-xl mb-4">1</div>
              <h3 className="font-bold mb-2">Upload Song</h3>
              <p className="text-secondary text-sm">Select any audio track, then paste the raw un-synced text of the lyrics into the editor.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-panel rounded-2xl border border-edge/20 shadow-sm">
              <div className="w-12 h-12 bg-[#38bdf8]/10 text-[#38bdf8] rounded-full flex items-center justify-center font-bold text-xl mb-4">2</div>
              <h3 className="font-bold mb-2">Tap to Sync</h3>
              <p className="text-secondary text-sm">Play the audio, and press the Spacebar exactly when the singer sings each line to record the timestamps.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-panel rounded-2xl border border-edge/20 shadow-sm">
              <div className="w-12 h-12 bg-[#38bdf8]/10 text-[#38bdf8] rounded-full flex items-center justify-center font-bold text-xl mb-4">3</div>
              <h3 className="font-bold mb-2">Export .LRC</h3>
              <p className="text-secondary text-sm">Fine-tune any mistakes in the timeline view, then export as a standard .lrc file for Karaoke apps.</p>
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

  // State 3: Syncing Mode
  return (
    <div className="h-full w-full flex flex-col bg-background text-foreground relative">
      {/* Transport Bar */}
      <div className="flex-none bg-panel border-b border-edge/20 p-4 sticky top-0 z-10 flex flex-col sm:flex-row gap-4 justify-between items-center">
        {/* Controls & Time */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlayPause}
              className={`p-3 rounded-full transition-colors ${isPlayingLocal ? 'bg-green-500/20 text-green-500' : 'bg-control hover:bg-edge/20'}`}
              title={isPlayingLocal ? "Pause" : "Play"}
            >
              {isPlayingLocal ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <button
              onClick={stopPlayback}
              className="p-3 rounded-full bg-control hover:bg-edge/20 transition-colors"
              title="Stop"
            >
              <Square className="w-4 h-4 fill-current" />
            </button>
          </div>
          
          <div className="font-mono text-sm">
            <span className="text-foreground">{formatTime(currentTime)}</span>
            <span className="text-secondary mx-2">/</span>
            <span className="text-secondary">{formatTime(duration)}</span>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex bg-control p-1 rounded-lg border border-edge/20">
          <button
            onClick={() => setActiveView("SYNC")}
            className={`px-6 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeView === "SYNC" ? "bg-panel text-foreground shadow-sm" : "text-secondary hover:text-foreground"
            }`}
          >
            SYNC
          </button>
          <button
            onClick={() => setActiveView("EDIT")}
            className={`px-6 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeView === "EDIT" ? "bg-panel text-foreground shadow-sm" : "text-secondary hover:text-foreground"
            }`}
          >
            EDIT
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto relative">
        {activeView === "EDIT" ? (
          <div className="h-full w-full p-6">
            <WaveformEditor
              trackUrl={trackUrl}
              lyrics={lyrics}
              onUpdateLine={handleLineUpdate}
              theme={theme}
            />
          </div>
        ) : (
          <div className="p-6 max-w-4xl mx-auto flex flex-col h-full">
            {/* Sync Actions Box */}
            <div className={`mb-8 p-6 rounded-2xl border-2 transition-colors ${
              isSyncSessionActive 
                ? isSpacebarDown ? 'bg-green-500/10 border-green-500/50' : 'bg-panel border-green-500/20'
                : 'bg-panel border-edge/20'
            }`}>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    {isSyncSessionActive ? "Syncing in Progress" : "Sync Mode"}
                  </h3>
                  <p className="text-sm text-secondary">
                    {isSyncSessionActive 
                      ? "Press SPACE to set the timestamp for the highlighted line." 
                      : "Start syncing to record lyric timestamps as the audio plays."}
                  </p>
                </div>
                
                <div className="flex gap-3 shrink-0">
                  {isSyncSessionActive ? (
                    <>
                      <button
                        onClick={triggerSyncTap}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-green-900/20 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <ChevronRight className="w-5 h-5" />
                        TAP (Space)
                      </button>
                      <button
                        onClick={() => { setIsSyncSessionActive(false); stopPlayback(); }}
                        className="bg-control hover:bg-edge/20 text-foreground px-4 py-2.5 rounded-xl font-medium transition-colors"
                      >
                        Finish
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={startSyncSession}
                      className="bg-foreground text-background hover:bg-foreground/90 px-6 py-2.5 rounded-xl font-semibold transition-colors flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Start Syncing
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Lyrics List */}
            <div className="flex-1 overflow-y-auto pb-32">
              <div className="space-y-1">
                {lyrics.map((line, idx) => {
                  const isActive = idx === activeLineIndex && isSyncSessionActive;
                  const isSynced = line.start !== null;
                  const isPast = idx < activeLineIndex && isSyncSessionActive;
                  
                  return (
                    <div
                      key={line.id}
                      id={`sync-line-${idx}`}
                      className={`relative px-4 py-3 rounded-lg flex items-center gap-4 transition-all duration-200 ${
                        isActive 
                          ? 'bg-panel border border-edge/20 shadow-sm pl-6 scale-[1.02]' 
                          : 'hover:bg-panel/50'
                      }`}
                    >
                      {/* Active Indicator Bar */}
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500 rounded-l-lg shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
                      )}
                      
                      <div className="w-8 text-right text-xs text-edge font-mono shrink-0">
                        {idx + 1}
                      </div>
                      
                      <div className={`flex-1 text-lg transition-colors ${
                        isActive ? 'text-foreground font-medium' : 
                        isSynced ? 'text-foreground' : 
                        'text-secondary'
                      }`}>
                        {line.text}
                      </div>
                      
                      <div className={`text-sm font-mono shrink-0 transition-colors w-20 text-right ${
                        isSynced ? 'text-green-500/80' : 'text-edge/40'
                      }`}>
                        {line.start !== null ? formatTime(line.start) : '--:--.--'}
                      </div>
                    </div>
                  );
                })}
                
                {/* End Marker */}
                <div 
                  id={`sync-line-${lyrics.length}`} 
                  className={`py-8 text-center text-secondary text-sm italic transition-opacity ${
                    activeLineIndex >= lyrics.length ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  End of lyrics
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Toolbar */}
      <div className="flex-none bg-panel border-t border-edge/20 p-4 sticky bottom-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-control px-3 py-1.5 rounded-md border border-edge/20 flex items-center gap-2 max-w-[200px] sm:max-w-xs">
            <Music className="w-4 h-4 text-secondary shrink-0" />
            <span className="text-sm truncate text-secondary">{trackFile?.name || "Audio Track"}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={handleClearAll}
            className="text-red-500 hover:bg-red-500/10 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
          
          <button
            onClick={handleExportLRC}
            disabled={lyrics.filter(l => l.start !== null).length === 0}
            className="bg-green-600 hover:bg-green-500 disabled:bg-control disabled:text-secondary text-white px-6 py-2 rounded-lg font-medium shadow-sm transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export .LRC
          </button>
        </div>
      </div>

      {/* Hidden Audio Element */}
      {trackUrl && <audio ref={audioRef} src={trackUrl} />}
    </div>
  );
}

export default LyricsSyncTool;
