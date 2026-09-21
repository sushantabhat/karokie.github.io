"use client";

import React, { useState, useRef } from "react";
import { Upload, Play, Square, Download, Scissors, Trash2, ArrowUp, ArrowDown, Activity, CheckCircle2 } from "lucide-react";
import { audioBufferToWav } from "@/utils/audioBufferToWav";
import { useUnsavedChanges } from "@/providers/UnsavedChangesProvider";

interface Track {
  id: string;
  file: File;
  buffer: AudioBuffer;
  trimStart: number;
  trimEnd: number;
  duration: number;
}

export default function AudioEditorTool() {
  const { setHasUnsavedChanges } = useUnsavedChanges();
  const [tracks, setTracks] = useState<Track[]>([]);

  React.useEffect(() => {
    setHasUnsavedChanges(tracks.length > 0);

    return () => {
      setHasUnsavedChanges(false);
    };
  }, [tracks, setHasUnsavedChanges]);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsProcessing(true);
    setProgress(10);
    setResultUrl(null);

    const newTracks: Track[] = [];
    
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setProgress(10 + Math.floor((i / files.length) * 80));
        
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        
        newTracks.push({
          id: Math.random().toString(36).substring(7),
          file,
          buffer: audioBuffer,
          trimStart: 0,
          trimEnd: audioBuffer.duration,
          duration: audioBuffer.duration,
        });
      }
      
      setTracks((prev) => [...prev, ...newTracks]);
    } catch (err) {
      console.error(err);
      alert("Error loading audio files.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const updateTrackTrim = (id: string, type: 'start' | 'end', value: number) => {
    setTracks(tracks.map(t => {
      if (t.id !== id) return t;
      let { trimStart, trimEnd } = t;
      
      if (type === 'start') {
        trimStart = Math.min(value, trimEnd - 0.5); // At least 0.5s gap
      } else {
        trimEnd = Math.max(value, trimStart + 0.5);
      }
      
      return { ...t, trimStart, trimEnd };
    }));
  };

  const moveTrack = (index: number, direction: 'up' | 'down') => {
    const newTracks = [...tracks];
    if (direction === 'up' && index > 0) {
      [newTracks[index - 1], newTracks[index]] = [newTracks[index], newTracks[index - 1]];
    } else if (direction === 'down' && index < newTracks.length - 1) {
      [newTracks[index + 1], newTracks[index]] = [newTracks[index], newTracks[index + 1]];
    }
    setTracks(newTracks);
  };

  const removeTrack = (id: string) => {
    setTracks(tracks.filter(t => t.id !== id));
  };

  const processAudio = async () => {
    if (tracks.length === 0) return;
    setIsProcessing(true);
    setProgress(10);

    try {
      // 1. Calculate total duration of all trimmed segments
      let totalDuration = 0;
      for (const track of tracks) {
        totalDuration += (track.trimEnd - track.trimStart);
      }
      
      if (totalDuration <= 0) throw new Error("Total duration is 0");

      const sampleRate = tracks[0].buffer.sampleRate;
      const offlineCtx = new OfflineAudioContext(2, sampleRate * totalDuration, sampleRate);
      
      setProgress(40);

      // 2. Schedule each track sequentially
      let currentTime = 0;
      for (const track of tracks) {
        const source = offlineCtx.createBufferSource();
        source.buffer = track.buffer;
        source.connect(offlineCtx.destination);
        
        const playDuration = track.trimEnd - track.trimStart;
        source.start(currentTime, track.trimStart, playDuration);
        
        currentTime += playDuration;
      }

      setProgress(70);
      const renderedBuffer = await offlineCtx.startRendering();
      
      setProgress(90);
      const wavBlob = audioBufferToWav(renderedBuffer);
      const url = URL.createObjectURL(wavBlob);
      
      setResultUrl(url);
      setProgress(100);
      
    } catch (error) {
      console.error("Error processing audio:", error);
      alert("Something went wrong while merging the audio.");
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background pt-16 px-4 pb-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 slide-in-from-bottom-2">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground flex items-center gap-3">
              <Scissors className="w-6 h-6 text-[#38bdf8]" />
              Cut & Join Audio
              <span className="sr-only"> - MP3 Cutter & Merger</span>
            </h1>
            <p className="text-secondary mt-1">Trim unwanted parts and merge multiple songs into a single track.</p>
          </div>
        </div>

        {/* Main UI */}
        <div className="bg-panel border border-edge/20 rounded-2xl p-6 shadow-sm relative overflow-hidden min-h-[400px]">
          
          {isProcessing ? (
            <div className="absolute inset-0 z-20 bg-panel/80 backdrop-blur-sm flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full border-4 border-edge/30 border-t-[#38bdf8] animate-spin mb-6" />
              <h3 className="font-bold text-xl mb-2">Processing Audio...</h3>
              <div className="w-64 h-2 bg-black/40 rounded-full overflow-hidden border border-edge/20 mt-4">
                <div 
                  className="h-full bg-[#38bdf8] transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : null}

          {!resultUrl ? (
            <div className="space-y-6">
              
              {/* Upload Button */}
              <label className="w-full flex flex-col items-center justify-center py-8 border-2 border-dashed border-edge/50 rounded-2xl bg-black/20 hover:bg-black/40 hover:border-[#38bdf8]/50 transition-all cursor-pointer group">
                <Upload className="w-8 h-8 text-[#38bdf8] mb-3 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-lg mb-1">Add Audio Files</span>
                <span className="text-sm text-muted">Upload one or more files to cut and join</span>
                <input 
                  type="file" 
                  accept=".mp3,.wav,.m4a,.aac,.ogg" 
                  multiple
                  className="hidden" 
                  onChange={handleUpload} 
                />
              </label>

              {/* Track List */}
              {tracks.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-lg border-b border-edge/20 pb-2">Your Timeline</h3>
                  
                  {tracks.map((track, index) => (
                    <div key={track.id} className="bg-black/30 border border-edge/20 rounded-xl p-4 flex flex-col gap-4">
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center shrink-0 font-bold text-muted">
                            {index + 1}
                          </div>
                          <span className="font-bold truncate text-sm">{track.file.name}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          <button onClick={() => moveTrack(index, 'up')} disabled={index === 0} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30">
                            <ArrowUp className="w-4 h-4" />
                          </button>
                          <button onClick={() => moveTrack(index, 'down')} disabled={index === tracks.length - 1} className="p-2 hover:bg-white/10 rounded-lg disabled:opacity-30">
                            <ArrowDown className="w-4 h-4" />
                          </button>
                          <button onClick={() => removeTrack(track.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg ml-2">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <div className="flex justify-between text-xs text-secondary mb-2">
                            <span>Start Time: {formatTime(track.trimStart)}</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max={track.duration} 
                            step="0.1"
                            value={track.trimStart}
                            onChange={(e) => updateTrackTrim(track.id, 'start', parseFloat(e.target.value))}
                            className="w-full accent-[#38bdf8]"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs text-secondary mb-2">
                            <span>End Time: {formatTime(track.trimEnd)}</span>
                            <span>Max: {formatTime(track.duration)}</span>
                          </div>
                          <input 
                            type="range" 
                            min="0" 
                            max={track.duration} 
                            step="0.1"
                            value={track.trimEnd}
                            onChange={(e) => updateTrackTrim(track.id, 'end', parseFloat(e.target.value))}
                            className="w-full accent-[#38bdf8]"
                          />
                        </div>
                      </div>
                      
                      <div className="text-xs text-right text-[#38bdf8] font-semibold">
                        Length: {formatTime(track.trimEnd - track.trimStart)}
                      </div>
                      
                    </div>
                  ))}
                  
                  <button
                    onClick={processAudio}
                    className="w-full mt-4 py-4 rounded-xl bg-foreground text-background font-black text-lg hover:bg-[#38bdf8] transition-colors shadow-lg flex items-center justify-center gap-2"
                  >
                    <Scissors className="w-5 h-5" />
                    {tracks.length === 1 ? "Export Cut Audio" : "Merge & Export"}
                  </button>
                </div>
              )}

            </div>
          ) : (
            /* Result State */
            <div className="flex flex-col items-center justify-center py-10 w-full max-w-lg mx-auto bg-black/40 backdrop-blur-md p-8 rounded-3xl border border-white/10 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-2xl font-black mb-1">Audio Ready!</h2>
              <p className="text-secondary text-sm mb-8">Your edited track has been successfully generated.</p>

              <div className="flex items-center gap-4 w-full mb-6">
                <button
                  onClick={togglePlayback}
                  className="w-16 h-16 shrink-0 rounded-full flex items-center justify-center transition-all bg-[#10b981] text-white hover:bg-[#059669] shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105"
                >
                  {isPlaying ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                </button>

                <button
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = resultUrl;
                    a.download = `Edited_Audio.wav`;
                    a.click();
                  }}
                  className="flex-1 h-16 rounded-xl flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold transition-all hover:scale-[1.02]"
                >
                  <Download className="w-5 h-5" />
                  Download
                </button>
              </div>

              <button
                onClick={() => {
                  setResultUrl(null);
                  setTracks([]);
                }}
                className="text-muted hover:text-white text-sm font-bold flex items-center gap-2 transition-colors mt-4"
              >
                Start New Project
              </button>

              <audio 
                ref={audioRef} 
                src={resultUrl} 
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
