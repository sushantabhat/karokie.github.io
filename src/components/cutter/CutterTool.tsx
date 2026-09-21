"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Square, Scissors, Trash2, Download, Plus, Music, ChevronUp, ChevronDown, RotateCcw, RotateCw } from "lucide-react";
import { audioBufferToWav } from "@/utils/audioBufferToWav";
import { audioBufferToMp3 } from "@/utils/audioBufferToMp3";
import { useUnsavedChanges } from "@/providers/UnsavedChangesProvider";

declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

interface Track {
  id: string;
  file: File;
  buffer: AudioBuffer;
  trimStart: number;
  trimEnd: number;
  duration: number;
}

// -------------------------------------------------------------
// WaveformTrack: Visual Editor for a vertical track
// -------------------------------------------------------------
function WaveformTrack({ 
  track,
  index,
  totalTracks,
  onUpdateTrim, 
  onRemove,
  onMoveUp,
  onMoveDown,
  audioCtx
}: { 
  track: Track; 
  index: number; 
  totalTracks: number; 
  onUpdateTrim: (id: string, start: number, end: number) => void;
  onRemove: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  audioCtx: AudioContext;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  const { buffer, trimStart, trimEnd, duration } = track;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  // Drawing the Waveform
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill container width dynamically
    const width = containerRef.current.clientWidth;
    const height = 120; // Taller for vertical layout
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, width, height);

    const data = buffer.getChannelData(0);

    const amp = height / 2;

    const handleWidth = 14;
    const drawWidth = width - (handleWidth * 2);
    const startX = handleWidth + (trimStart / duration) * drawWidth;
    const endX = handleWidth + (trimEnd / duration) * drawWidth;

    const stepDraw = Math.ceil(data.length / drawWidth);

    for (let i = 0; i < drawWidth; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < stepDraw; j++) {
        const datum = data[i * stepDraw + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      const y = (1 + min) * amp;
      const h = Math.max(1, (max - min) * amp);

      const drawX = handleWidth + i;

      // Distinct styling for trimmed vs active regions
      if (drawX >= startX && drawX <= endX) {
        ctx.fillStyle = "#10b981"; // Bright Green (Emerald)
      } else {
        ctx.fillStyle = "#334155"; // Muted Slate for trimmed out parts
      }
      
      ctx.fillRect(drawX, y, 1, h);
    }

    // Draw teal brackets for the active trim region
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)"; // Dark overlay
    ctx.fillRect(handleWidth, 0, startX - handleWidth, height);
    ctx.fillRect(endX, 0, drawWidth - (endX - handleWidth), height);

    ctx.fillStyle = "#2dd4bf"; // Teal grabbers
    
    // Left Handle (drawn completely OUTSIDE the selected region)
    ctx.beginPath();
    ctx.roundRect(startX - handleWidth, 0, handleWidth, height, [6, 0, 0, 6]);
    ctx.fill();

    // Right Handle (drawn completely OUTSIDE the selected region)
    ctx.beginPath();
    ctx.roundRect(endX, 0, handleWidth, height, [0, 6, 6, 0]);
    ctx.fill();

    // Inner lines on handles for grab effect
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(startX - handleWidth + 4, height/2 - 10, 2, 20);
    ctx.fillRect(startX - handleWidth + 8, height/2 - 10, 2, 20);
    
    ctx.fillRect(endX + 4, height/2 - 10, 2, 20);
    ctx.fillRect(endX + 8, height/2 - 10, 2, 20);

    // Playhead line (always visible so it doesn't disappear when pushed to 0)
    const playheadX = startX + ((currentTime / (trimEnd - trimStart)) * (endX - startX));
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(Math.min(playheadX, endX - 2), 0, 2, height);
    
    // Floating time bubble above playhead
    ctx.fillStyle = "rgba(30, 41, 59, 0.9)";
    ctx.beginPath();
    ctx.roundRect(playheadX - 24, 4, 48, 20, 10);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(formatTime(trimStart + currentTime), playheadX, 18);

  }, [buffer, trimStart, trimEnd, currentTime, isPlaying, duration]);

  // Dragging Logic
  const [dragging, setDragging] = useState<'start' | 'end' | 'playhead' | null>(null);
  const dragOffsetRef = useRef<number>(0);
  const absolutePlayheadRef = useRef<number>(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const handleWidth = 14;
    const rect = containerRef.current.getBoundingClientRect();
    const drawWidth = rect.width - (handleWidth * 2);
    const x = e.clientX - rect.left - handleWidth;
    const pointerTime = (x / drawWidth) * duration;
    const clickTime = Math.max(0, Math.min(pointerTime, duration));

    absolutePlayheadRef.current = trimStart + currentTime;

    // Convert pixel dimensions to time to create perfectly accurate physical hit boxes
    const handleTime = (handleWidth / drawWidth) * duration;
    const paddingTime = (10 / drawWidth) * duration; // 10px slop for easy touch targeting on mobile

    // Left handle physically sits from [trimStart - handleTime] to [trimStart]
    if (pointerTime >= trimStart - handleTime - paddingTime && pointerTime <= trimStart + paddingTime) {
      dragOffsetRef.current = pointerTime - trimStart;
      setDragging('start');
      if (isPlaying) stopPlayback();
    } 
    // Right handle physically sits from [trimEnd] to [trimEnd + handleTime]
    else if (pointerTime >= trimEnd - paddingTime && pointerTime <= trimEnd + handleTime + paddingTime) {
      dragOffsetRef.current = pointerTime - trimEnd;
      setDragging('end');
      if (isPlaying) stopPlayback();
    } 
    // Otherwise, if they clicked inside the waveform, move the playhead
    else if (clickTime > trimStart && clickTime < trimEnd) {
      const localTime = clickTime - trimStart;
      setCurrentTime(localTime);
      if (isPlaying) {
        stopPlayback();
        startPlayback(localTime);
      }
    }
  };



  useEffect(() => {
    if (!dragging) return;
    
    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const handleWidth = 14;
      const rect = containerRef.current.getBoundingClientRect();
      const drawWidth = rect.width - (handleWidth * 2);
      const x = e.clientX - rect.left - handleWidth;
      const rawTime = (x / drawWidth) * duration;
      let newTime = rawTime - dragOffsetRef.current;
      newTime = Math.max(0, Math.min(newTime, duration));

      const minClip = Math.min(0.1, duration * 0.9); // Clamp for very short clips

      if (dragging === 'start') {
        const newTrimStart = Math.min(newTime, trimEnd - minClip);
        const newRelativeTime = absolutePlayheadRef.current - newTrimStart;
        setCurrentTime(Math.max(0, Math.min(newRelativeTime, trimEnd - newTrimStart)));
        onUpdateTrim(track.id, newTrimStart, trimEnd);
      } else if (dragging === 'end') {
        const newTrimEnd = Math.max(newTime, trimStart + minClip);
        const newRelativeTime = absolutePlayheadRef.current - trimStart;
        setCurrentTime(Math.max(0, Math.min(newRelativeTime, newTrimEnd - trimStart)));
        onUpdateTrim(track.id, trimStart, newTrimEnd);
      }
    };

    const handlePointerUp = () => {
      setDragging(null);
      dragOffsetRef.current = 0;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    window.addEventListener('blur', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
      window.removeEventListener('blur', handlePointerUp);
    };
  }, [dragging, duration, trimStart, trimEnd, track.id, onUpdateTrim]);

  // Playback Logic
  const startPlayback = (startOffset = 0) => {
    if (sourceNodeRef.current) sourceNodeRef.current.disconnect();
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    
    source.start(0, trimStart + startOffset, (trimEnd - trimStart) - startOffset);
    sourceNodeRef.current = source;
    startTimeRef.current = audioCtx.currentTime - startOffset;
    setIsPlaying(true);
    
    source.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };

    const updateTime = () => {
      if (sourceNodeRef.current) {
        setCurrentTime(audioCtx.currentTime - startTimeRef.current);
        animationRef.current = requestAnimationFrame(updateTime);
      }
    };
    animationRef.current = requestAnimationFrame(updateTime);
  };

  const stopPlayback = useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.onended = null;
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsPlaying(false);
  }, []);

  const jump = (seconds: number) => {
    const newTime = Math.max(0, Math.min(currentTime + seconds, trimEnd - trimStart));
    setCurrentTime(newTime);
    if (isPlaying) {
      stopPlayback();
      startPlayback(newTime);
    }
  };

  useEffect(() => {
    return () => stopPlayback();
  }, [stopPlayback]);

  const handlePointerHover = (e: React.PointerEvent) => {
    if (dragging) return;
    if (!containerRef.current) return;
    const handleWidth = 14;
    const rect = containerRef.current.getBoundingClientRect();
    const drawWidth = rect.width - (handleWidth * 2);
    const x = e.clientX - rect.left - handleWidth;
    const pointerTime = (x / drawWidth) * duration;
    
    const handleTime = (handleWidth / drawWidth) * duration;
    const paddingTime = (10 / drawWidth) * duration;

    let cursor = 'crosshair';
    if (pointerTime >= trimStart - handleTime - paddingTime && pointerTime <= trimStart + paddingTime) {
      cursor = 'col-resize';
    } else if (pointerTime >= trimEnd - paddingTime && pointerTime <= trimEnd + handleTime + paddingTime) {
      cursor = 'col-resize';
    }
    containerRef.current.style.cursor = cursor;
  };

  return (
    <div className="w-full bg-[#1e293b] rounded-2xl border border-edge/20 p-4 md:p-5 flex flex-col gap-4 shadow-sm relative overflow-hidden">
      
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 w-full">
        <div className="flex-1 min-w-0 pr-8 md:pr-0">
          <h3 className="text-sm font-bold text-foreground truncate break-all mb-0.5">
            {index + 1}. {track.file.name}
          </h3>
          <span className="text-xs text-secondary font-medium">
            Duration: {formatTime(trimEnd - trimStart)}
          </span>
        </div>
        
        {/* Delete Button (absolute on mobile for top-right placement) */}
        <button aria-label="Remove track"
          onClick={() => onRemove(track.id)}
          className="absolute top-4 right-4 md:relative md:top-0 md:right-0 w-8 h-8 rounded-full bg-red-500/10 text-red-400 hover:text-red-500 hover:bg-red-500/20 flex items-center justify-center shrink-0 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Waveform Row */}
      <div 
        ref={containerRef}
        className="relative w-full rounded-lg bg-black/40 overflow-hidden border border-black/20"
        style={{ cursor: 'crosshair' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerHover}
        onPointerLeave={() => {
          if (containerRef.current) containerRef.current.style.cursor = 'crosshair';
        }}
      >
        <canvas ref={canvasRef} className="block w-full touch-pan-y" />
      </div>
      
      {/* Controls Row */}
      <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4 mt-1">
         
         {/* Reorder Arrows */}
         <div className="flex items-center gap-1.5 shrink-0">
           <button aria-label="Move track up"
             onClick={() => onMoveUp(index)}
             disabled={index === 0}
             className="w-10 h-10 bg-black/20 border border-edge/10 rounded-xl flex items-center justify-center text-secondary hover:text-foreground hover:bg-black/40 disabled:opacity-30 disabled:pointer-events-none transition-all"
           >
             <ChevronUp className="w-5 h-5" />
           </button>
           <button aria-label="Move track down"
             onClick={() => onMoveDown(index)}
             disabled={index === totalTracks - 1}
             className="w-10 h-10 bg-black/20 border border-edge/10 rounded-xl flex items-center justify-center text-secondary hover:text-foreground hover:bg-black/40 disabled:opacity-30 disabled:pointer-events-none transition-all"
           >
             <ChevronDown className="w-5 h-5" />
           </button>
         </div>

         {/* Playback Controls (Centered on desktop, right aligned on mobile) */}
         <div className="flex items-center gap-3 md:gap-6 mx-auto md:ml-auto md:mr-0 ml-auto">
           <button onClick={() => jump(-10)} className="text-secondary hover:text-foreground transition-colors p-2 shrink-0" aria-label="Rewind 10 seconds" title="Rewind 10s">
             <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
           </button>
           <button 
             onClick={() => isPlaying ? stopPlayback() : startPlayback(currentTime >= trimEnd - trimStart - 0.01 ? 0 : currentTime)}
             aria-label={isPlaying ? "Pause" : "Play"}
             className="w-12 h-12 md:w-14 md:h-14 bg-foreground text-background rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform shrink-0"
           >
             {isPlaying ? <Square className="w-5 h-5 md:w-6 md:h-6 fill-current" /> : <Play className="w-5 h-5 md:w-6 md:h-6 ml-1 fill-current" />}
           </button>
           <button onClick={() => jump(10)} className="text-secondary hover:text-foreground transition-colors p-2 shrink-0" aria-label="Forward 10 seconds" title="Forward 10s">
             <RotateCw className="w-5 h-5 md:w-6 md:h-6" />
           </button>
         </div>
         
         {/* Empty spacer to balance flex on desktop if needed, but flex-wrap handles mobile */}
      </div>
      
    </div>
  );
}

// -------------------------------------------------------------
// CutterTool: Vertical Timeline App
// -------------------------------------------------------------
import { ProcessingOverlay } from "../shared/ProcessingOverlay";

export default function CutterTool() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [format, setFormat] = useState<'wav' | 'mp3'>('mp3');
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { setHasUnsavedChanges } = useUnsavedChanges();

  React.useEffect(() => {
    setHasUnsavedChanges(tracks.length > 0);
    return () => setHasUnsavedChanges(false);
  }, [tracks, setHasUnsavedChanges]);

  useEffect(() => {
    return () => {
      if (audioCtx && audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    };
  }, [audioCtx]);

  const triggerUpload = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset
      fileInputRef.current.click();
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    let ctx = audioCtx;
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      setAudioCtx(ctx);
    }

    try {
      const newTracks: Track[] = [];
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = await ctx.decodeAudioData(arrayBuffer);
        newTracks.push({
          id: Math.random().toString(36).substring(7),
          file,
          buffer,
          trimStart: 0,
          trimEnd: buffer.duration,
          duration: buffer.duration,
        });
      }
      
      setTracks((prev) => [...prev, ...newTracks]);
    } catch (err) {
      console.error(err);
      alert("Error loading audio files.");
    }
  };

  const updateTrim = (id: string, start: number, end: number) => {
    setTracks(tracks.map(t => t.id === id ? { ...t, trimStart: start, trimEnd: end } : t));
  };

  const removeTrack = (id: string) => {
    setTracks(tracks.filter(t => t.id !== id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setTracks(prev => {
      const copy = [...prev];
      [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
      return copy;
    });
  };

  const moveDown = (index: number) => {
    if (index === tracks.length - 1) return;
    setTracks(prev => {
      const copy = [...prev];
      [copy[index + 1], copy[index]] = [copy[index], copy[index + 1]];
      return copy;
    });
  };

  const processAndDownload = async () => {
    if (tracks.length === 0) return;
    setIsProcessing(true);

    try {
      let totalDuration = 0;
      for (const t of tracks) totalDuration += (t.trimEnd - t.trimStart);
      
      const sampleRate = tracks[0].buffer.sampleRate;
      const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * totalDuration), sampleRate);
      
      let currentTime = 0;
      for (const track of tracks) {
        const source = offlineCtx.createBufferSource();
        source.buffer = track.buffer;
        source.connect(offlineCtx.destination);
        const playDuration = track.trimEnd - track.trimStart;
        source.start(currentTime, track.trimStart, playDuration);
        currentTime += playDuration;
      }

      const renderedBuffer = await offlineCtx.startRendering();
      
      const blob = format === 'mp3' 
        ? await audioBufferToMp3(renderedBuffer) 
        : audioBufferToWav(renderedBuffer);
        
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = tracks.length > 1 ? `Merged_Audio.${format}` : `Cut_Audio.${format}`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error(err);
      alert("Error processing audio");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 w-full h-full bg-background flex flex-col font-sans text-foreground relative min-h-0">
      <ProcessingOverlay isVisible={isProcessing} text="Exporting audio..." />
      
      {/* Hidden file input used by + buttons */}
      <input 
        ref={fileInputRef}
        type="file" 
        accept="audio/*" 
        multiple 
        className="hidden" 
        onChange={handleUpload} 
      />

      {tracks.length === 0 ? (
        <div id="top" className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar w-full h-full relative z-10">
          <div className="w-full flex flex-col items-center justify-center min-h-[100dvh] pt-16">
            <div className="flex flex-col items-center text-center animate-in fade-in duration-300 slide-in-from-bottom-2 max-w-2xl mx-auto p-4">
              <div className="flex items-center gap-6 mb-12 text-sm font-bold tracking-widest text-secondary uppercase">
                <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="text-secondary hover:text-foreground transition-colors pb-1 flex items-center gap-2">How it works <span>↓</span></button>
              </div>

              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-foreground">
                Audio Cutter
              </h1>
              <p className="text-lg md:text-xl text-secondary mb-10 font-medium">
                Free editor to trim, cut, and merge audio files
              </p>

              <button onClick={triggerUpload} className="px-8 py-3 rounded-full bg-foreground text-background hover:opacity-90 hover:scale-105 active:scale-95 cursor-pointer transition-all font-bold text-sm shadow-xl">
                Browse my files
              </button>
            </div>
          </div>
          
          <div id="how-it-works" className="w-full max-w-4xl mx-auto p-8 bg-panel/30 border-t border-edge/20 rounded-t-3xl min-h-[60vh]">
            <h2 className="text-3xl font-black mb-12 text-center">How to use Audio Cutter</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 bg-panel rounded-2xl border border-edge/20 shadow-sm">
                <div className="w-12 h-12 bg-[#38bdf8]/10 text-[#38bdf8] rounded-full flex items-center justify-center font-bold text-xl mb-4">1</div>
                <h3 className="font-bold mb-2">Upload Tracks</h3>
                <p className="text-secondary text-sm">Add one or multiple audio tracks to the timeline.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-panel rounded-2xl border border-edge/20 shadow-sm">
                <div className="w-12 h-12 bg-[#38bdf8]/10 text-[#38bdf8] rounded-full flex items-center justify-center font-bold text-xl mb-4">2</div>
                <h3 className="font-bold mb-2">Trim & Cut</h3>
                <p className="text-secondary text-sm">Drag the teal handles on the left and right edges of any track to trim exactly what you want.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-panel rounded-2xl border border-edge/20 shadow-sm">
                <div className="w-12 h-12 bg-[#38bdf8]/10 text-[#38bdf8] rounded-full flex items-center justify-center font-bold text-xl mb-4">3</div>
                <h3 className="font-bold mb-2">Merge</h3>
                <p className="text-secondary text-sm">Tracks stack sequentially. You can reorder them, then Export to stitch them all into one track.</p>
              </div>
            </div>
            <div className="flex justify-center mt-12">
              <button onClick={() => document.getElementById("top")?.scrollIntoView({ behavior: "smooth" })} className="px-6 py-2 rounded-full bg-edge/20 hover:bg-edge/40 text-foreground text-sm font-bold transition-all flex items-center gap-2">
                ↑ Back to top
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Header ONLY visible in timeline mode. Adjusted padding for mobile sidebar hamburger */}
          <div className="w-full flex items-center justify-between px-4 pl-16 md:pl-4 py-3 bg-panel border-b border-edge/20 flex-shrink-0 relative z-20">
            <h2 className="text-lg md:text-xl font-bold tracking-tight text-foreground flex items-center gap-2 truncate">
              <Scissors className="w-5 h-5 text-[#38bdf8] shrink-0" /> <span className="truncate">Cutter / Splitter</span>
            </h2>
          </div>
          
          {/* Vertical Timeline Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-background">
            <div className="flex flex-col gap-6 max-w-4xl w-full mx-auto px-3 md:px-4 py-6 pb-32">
              {tracks.map((track, i) => (
                <WaveformTrack 
                  key={track.id}
                  track={track} 
                  index={i}
                  totalTracks={tracks.length}
                  onUpdateTrim={updateTrim}
                  onRemove={removeTrack}
                  onMoveUp={moveUp}
                  onMoveDown={moveDown}
                  audioCtx={audioCtx!} 
                />
              ))}
              
              {/* Add Tracks Full-width Dashed Button */}
              <button 
                onClick={triggerUpload}
                className="w-full mt-2 py-8 rounded-2xl border-2 border-dashed border-[#8b5cf6]/50 text-[#8b5cf6] hover:bg-[#8b5cf6]/10 hover:border-[#8b5cf6] flex flex-col items-center justify-center gap-3 font-bold transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
                Add Track
              </button>
            </div>
          </div>

          {/* Sticky Footer UI mimicking the reference image */}
          <div className="w-full flex-shrink-0 bg-[#0f172a] border-t border-edge/20 p-4 md:p-6 flex items-center justify-between gap-4 sticky bottom-0 z-50">
             <div className="flex items-center gap-1 bg-[#1e293b] p-1 rounded-full border border-edge/20 shrink-0">
               <button 
                 onClick={() => setFormat('mp3')} 
                 className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-bold transition-all ${format === 'mp3' ? 'bg-[#10b981] text-black shadow-md' : 'text-secondary hover:text-foreground'}`}
               >
                 mp3
               </button>
               <button 
                 onClick={() => setFormat('wav')} 
                 className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-bold transition-all ${format === 'wav' ? 'bg-[#10b981] text-black shadow-md' : 'text-secondary hover:text-foreground'}`}
               >
                 wav
               </button>
             </div>
             
             <button 
                onClick={processAndDownload}
                disabled={isProcessing}
                className="flex-1 max-w-[300px] py-3 rounded-full bg-slate-200 text-slate-900 font-bold text-sm md:text-lg shadow-lg hover:bg-white transition-colors disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center"
              >
                {isProcessing ? 'Processing...' : 'Save'}
              </button>
          </div>
        </div>
      )}
    </div>
  );
}
