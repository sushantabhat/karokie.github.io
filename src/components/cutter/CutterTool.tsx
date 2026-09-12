"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Play, Square, Scissors, Trash2, Download, Plus, Music } from "lucide-react";
import { audioBufferToWav } from "@/utils/audioBufferToWav";

interface Track {
  id: string;
  file: File;
  buffer: AudioBuffer;
  trimStart: number;
  trimEnd: number;
  duration: number;
}

// -------------------------------------------------------------
// WaveformTrack: Visual Editor for a horizontal track
// -------------------------------------------------------------
function WaveformTrack({ 
  track, 
  onUpdateTrim, 
  onRemove,
  audioCtx
}: { 
  track: Track; index?: number; totalTracks?: number; 
  onUpdateTrim: (id: string, start: number, end: number) => void;
  onRemove: (id: string) => void;
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

  // Drawing the Waveform
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fixed width for horizontal layout
    const width = containerRef.current.clientWidth;
    const height = 160; 
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, width, height);

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = height / 2;

    ctx.fillStyle = "#0ea5e9"; // Bright Green

    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = data[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      const y = (1 + min) * amp;
      const h = Math.max(1, (max - min) * amp);
      ctx.fillRect(i, y, 1, h);
    }

    const startX = (trimStart / duration) * width;
    const endX = (trimEnd / duration) * width;

    // Dark Overlay for cut regions
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, startX, height);
    ctx.fillRect(endX, 0, width - endX, height);

    // Teal Handles
    ctx.fillStyle = "#38bdf8";
    const handleWidth = 8;
    ctx.fillRect(startX - handleWidth/2, 0, handleWidth, height);
    ctx.fillRect(endX - handleWidth/2, 0, handleWidth, height);

    // Playhead
    if (isPlaying || currentTime > 0) {
      const playheadX = (currentTime / duration) * width;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(playheadX - 1, 0, 2, height);
    }
  }, [buffer, trimStart, trimEnd, currentTime, isPlaying, duration]);

  // Dragging Logic
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickTime = (x / rect.width) * duration;

    const margin = duration * 0.05;
    if (Math.abs(clickTime - trimStart) < margin) {
      setDragging('start');
    } else if (Math.abs(clickTime - trimEnd) < margin) {
      setDragging('end');
    } else if (clickTime > trimStart && clickTime < trimEnd) {
      setCurrentTime(clickTime);
      if (isPlaying) {
        stopPlayback();
        startPlayback(clickTime);
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newTime = (x / rect.width) * duration;

    if (dragging === 'start') {
      onUpdateTrim(track.id, Math.min(newTime, trimEnd - 0.2), trimEnd);
    } else {
      onUpdateTrim(track.id, trimStart, Math.max(newTime, trimStart + 0.2));
    }
  };

  const handlePointerUp = () => setDragging(null);

  // Playback
  const startPlayback = (startAt = trimStart) => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    stopPlayback();

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0, startAt);
    startTimeRef.current = audioCtx.currentTime - startAt;
    sourceNodeRef.current = source;
    setIsPlaying(true);

    const updatePlayhead = () => {
      const current = audioCtx.currentTime - startTimeRef.current;
      if (current >= trimEnd) {
        stopPlayback();
        setCurrentTime(trimStart);
      } else {
        setCurrentTime(current);
        animationRef.current = requestAnimationFrame(updatePlayhead);
      }
    };
    animationRef.current = requestAnimationFrame(updatePlayhead);
  };

  const stopPlayback = useCallback(() => {
    if (sourceNodeRef.current) {
      try { sourceNodeRef.current.stop(); } catch(e) {}
      sourceNodeRef.current.disconnect();
    }
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsPlaying(false);
  }, []);

  const togglePlayback = () => {
    if (isPlaying) stopPlayback();
    else startPlayback(currentTime < trimStart || currentTime >= trimEnd ? trimStart : currentTime);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="w-[600px] shrink-0 bg-black/30 rounded-xl overflow-hidden shadow-2xl border border-edge/50 flex flex-col group">
      
      {/* Top Track Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-panel border-b border-edge/20">
        <div className="flex items-center gap-3 overflow-hidden">
          <button
            onClick={togglePlayback}
            className="w-8 h-8 shrink-0 rounded-full bg-[#38bdf8] hover:bg-[#0ea5e9] flex items-center justify-center transition-all"
          >
            {isPlaying ? <Square className="w-4 h-4 text-black" /> : <Play className="w-4 h-4 text-black ml-0.5" />}
          </button>
          <span className="text-sm font-bold text-foreground truncate">
            {track.file.name}
          </span>
        </div>
        <button onClick={() => onRemove(track.id)} className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-md shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Waveform Canvas */}
      <div 
        ref={containerRef}
        className="w-full h-[160px] relative touch-none cursor-crosshair bg-black/20"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <canvas ref={canvasRef} className="absolute inset-0 block w-full h-full pointer-events-none" />
      </div>

      {/* Footer Info */}
      <div className="flex justify-between px-3 py-1.5 text-[10px] text-muted bg-panel border-t border-edge/20 font-mono">
        <span>Start: {formatTime(trimStart)}</span>
        <span className="text-[#38bdf8] font-bold">Len: {formatTime(trimEnd - trimStart)}</span>
        <span>End: {formatTime(trimEnd)}</span>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// CutterTool: Horizontal Timeline App
// -------------------------------------------------------------
export default function CutterTool() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  
  // Ref for the invisible file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [insertTarget, setInsertTarget] = useState<number>(0);

  const triggerUpload = (index: number) => {
    setInsertTarget(index);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset
      fileInputRef.current.click();
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    try {
      const newTracks: Track[] = [];
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = await audioCtxRef.current.decodeAudioData(arrayBuffer);
        newTracks.push({
          id: Math.random().toString(36).substring(7),
          file,
          buffer,
          trimStart: 0,
          trimEnd: buffer.duration,
          duration: buffer.duration,
        });
      }
      
      setTracks((prev) => {
        const updated = [...prev];
        updated.splice(insertTarget, 0, ...newTracks);
        return updated;
      });
      
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

  const processAndDownload = async () => {
    if (tracks.length === 0) return;
    setIsProcessing(true);

    try {
      let totalDuration = 0;
      for (const t of tracks) totalDuration += (t.trimEnd - t.trimStart);
      
      const sampleRate = tracks[0].buffer.sampleRate;
      const offlineCtx = new OfflineAudioContext(2, sampleRate * totalDuration, sampleRate);
      
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
      const wavBlob = audioBufferToWav(renderedBuffer);
      const url = URL.createObjectURL(wavBlob);

      const a = document.createElement("a");
      a.href = url;
      a.download = tracks.length > 1 ? `Merged_Audio.wav` : `Cut_Audio.wav`;
      a.click();
    } catch (err) {
      console.error(err);
      alert("Error processing audio");
    } finally {
      setIsProcessing(false);
    }
  };

  // The Add Button UI
  const AddButton = ({ index }: { index: number }) => (
    <button 
      onClick={() => triggerUpload(index)}
      className="w-12 h-12 shrink-0 rounded-full border-2 border-dashed border-[#38bdf8]/50 hover:bg-[#38bdf8]/20 hover:border-[#38bdf8] flex items-center justify-center transition-all group"
    >
      <Plus className="w-6 h-6 text-[#38bdf8] group-hover:scale-125 transition-transform" />
    </button>
  );

  return (
    <div className="flex-1 overflow-hidden bg-background h-screen pt-16 flex flex-col font-sans text-foreground">
      
      

      {/* Horizontal Timeline Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden flex items-center custom-scrollbar relative px-8 py-10 bg-background">
        
        {/* Hidden file input used by all + buttons */}
        <input 
          ref={fileInputRef}
          type="file" 
          accept="audio/*" 
          multiple 
          className="hidden" 
          onChange={handleUpload} 
        />

        {tracks.length === 0 ? (
          <div className="w-full pb-20">
            <div className="w-full flex flex-col items-center justify-center min-h-[100vh]">
              <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500 max-w-2xl mx-auto">
                <div className="flex items-center gap-6 mb-12 text-sm font-bold tracking-widest text-secondary uppercase">
                  <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="text-secondary hover:text-foreground transition-colors pb-1 flex items-center gap-2">How it works <span>↓</span></button>
                </div>

                <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-foreground">
                  Audio Cutter
                </h1>
                <p className="text-lg md:text-xl text-secondary mb-10 font-medium">
                  Free editor to trim and cut any audio file online
                </p>

                <button 
                  onClick={() => triggerUpload(0)}
                  className="px-8 py-3 rounded-full border border-edge/40 hover:bg-control cursor-pointer transition-colors text-foreground font-semibold text-sm shadow-sm backdrop-blur-sm"
                >
                  Browse my files
                </button>
              </div>
            </div>

            <div id="how-it-works" className="w-full max-w-4xl mx-auto mt-12 p-8 bg-panel/30 border-t border-edge/20 rounded-t-3xl">
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
                  <p className="text-secondary text-sm">Click [+] between tracks to seamlessly stitch multiple songs together, then Export.</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-4 h-full py-10">
            {/* Very First Add Button */}
            <AddButton index={0} />
            
            {tracks.map((track, i) => (
              <React.Fragment key={track.id}>
                {/* The Waveform Track */}
                <WaveformTrack 
                  track={track} 
                  index={i}
                  totalTracks={tracks.length}
                  onUpdateTrim={updateTrim}
                  onRemove={removeTrack}
                  audioCtx={audioCtxRef.current!} 
                />
                
                {/* Add Button AFTER this track */}
                <AddButton index={i + 1} />
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Floating Bar */}
      {tracks.length > 0 && (
        <div className="bg-panel border-t border-edge/20 p-4 px-8 flex items-center justify-between shadow-[0_-10px_30px_rgba(0,0,0,0.5)] z-20">
          <div className="flex flex-col">
            <span className="text-xs text-secondary font-bold uppercase tracking-wider mb-0.5">Total Timeline</span>
            <span className="text-foreground font-mono text-sm">
              {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
            </span>
          </div>
          
          <button 
            onClick={processAndDownload}
            disabled={isProcessing}
            className="px-10 py-4 bg-[#38bdf8] hover:bg-[#0ea5e9] text-black font-black rounded-full transition-all shadow-lg shadow-sky-900/50 flex items-center gap-2 text-lg"
          >
            <Download className="w-6 h-6" />
            {isProcessing ? "Processing..." : (tracks.length > 1 ? "Merge & Download" : "Download Cut")}
          </button>
        </div>
      )}

      {/* Custom Scrollbar Styles embedded */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          height: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1f2335;
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #38bdf8;
          border-radius: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #0ea5e9;
        }
      `}} />

    </div>
  );
}
