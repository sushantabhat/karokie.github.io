"use client";

import React, { useState, useRef } from "react";
import { Upload, Music, Play, Square, Download, Sparkles, RefreshCcw, Activity, Wand2, CheckCircle2 } from "lucide-react";
import { audioBufferToWav } from "@/utils/audioBufferToWav";

export default function SplitterTool() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [instrumentalUrl, setInstrumentalUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setInstrumentalUrl(null);
    }
  };

  const processAudio = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgress(10);

    try {
      const arrayBuffer = await file.arrayBuffer();
      setProgress(30);

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      setProgress(60);

      // Advanced DSP Center-Cancellation (Karaoke Effect)
      // 1. We take the Left and Right channels.
      // 2. We invert the right channel (multiply by -1) and sum it with the left.
      //    This perfectly mathematically cancels out anything panned dead-center (Lead Vocals, Bass, Kick).
      // 3. To bring the Bass and Kick drum back, we mix in the original audio through a Lowpass filter (< 200Hz).
      
      const offlineCtx = new OfflineAudioContext(
        2, // Stereo output
        audioBuffer.length,
        audioBuffer.sampleRate
      );

      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;

      const splitter = offlineCtx.createChannelSplitter(2);
      source.connect(splitter);

      // --- The Vocal Canceller (Mid & High frequencies) ---
      const vocalCancellerGainL = offlineCtx.createGain();
      const vocalCancellerGainR = offlineCtx.createGain();
      vocalCancellerGainL.gain.value = 1.0;
      vocalCancellerGainR.gain.value = -1.0; // Invert phase

      splitter.connect(vocalCancellerGainL, 0); // Left channel
      splitter.connect(vocalCancellerGainR, 1); // Right channel

      // CRITICAL FIX: Force the node to mono so it mathematically sums L and -R.
      // If we don't do this, the browser just plays them in separate ears and vocals aren't removed!
      const cancelledSum = offlineCtx.createGain();
      cancelledSum.channelCount = 1;
      cancelledSum.channelCountMode = 'explicit';
      
      vocalCancellerGainL.connect(cancelledSum);
      vocalCancellerGainR.connect(cancelledSum);

      // Highpass to remove the weird out-of-phase low end
      const highpass = offlineCtx.createBiquadFilter();
      highpass.type = "highpass";
      highpass.frequency.value = 200;
      cancelledSum.connect(highpass);

      // Connect the cancelled vocals (which is now mono) to the stereo destination.
      // The browser will automatically duplicate this mono signal to both Left and Right speakers.
      highpass.connect(offlineCtx.destination);

      // --- The Bass Preserver (Low frequencies) ---
      // Keep the original stereo kick drum and bass guitar intact since they were cancelled out.
      const lowpass = offlineCtx.createBiquadFilter();
      lowpass.type = "lowpass";
      lowpass.frequency.value = 200;
      source.connect(lowpass);

      const bassGain = offlineCtx.createGain();
      bassGain.gain.value = 1.2; // slight bass boost to compensate
      lowpass.connect(bassGain);
      
      // Mix the original stereo bass back into the master destination
      bassGain.connect(offlineCtx.destination);
      source.start();

      setProgress(80);
      const renderedBuffer = await offlineCtx.startRendering();
      
      setProgress(95);
      const wavBlob = audioBufferToWav(renderedBuffer);
      const url = URL.createObjectURL(wavBlob);
      
      setInstrumentalUrl(url);
      setProgress(100);
      
    } catch (error) {
      console.error("Error processing audio:", error);
      alert("Something went wrong while splitting the audio.");
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

  const downloadTrack = () => {
    if (!instrumentalUrl) return;
    const a = document.createElement("a");
    a.href = instrumentalUrl;
    a.download = `Instrumental_${file?.name || 'track.wav'}`;
    a.click();
  };

  return (
    <div id="top" className="flex-1 overflow-y-auto bg-background relative font-sans text-foreground scroll-smooth">
      
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {!file && !isProcessing && (
        <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500 max-w-2xl mx-auto">
          <div className="flex items-center gap-6 mb-12 text-sm font-bold tracking-widest text-secondary uppercase">
            <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="text-secondary hover:text-foreground transition-colors pb-1 flex items-center gap-2">How it works <span>↓</span></button>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-foreground">
            Vocal Remover
          </h1>
          <p className="text-lg md:text-xl text-secondary mb-4 font-medium">
            Instantly extract an instrumental karaoke track from any song
          </p>
          <p className="text-sm text-secondary/80 max-w-lg mx-auto mb-10">
            Note: Since I can't afford expensive high-end AI APIs (lol), our lightning-fast local processor purposely leaves a faint "ghost pitch" of the original artist in the background. But hey, it actually acts as a perfect guide to help you stay on key while singing!
          </p>

          <label className="px-8 py-3 rounded-full border border-edge/40 hover:bg-control cursor-pointer transition-colors text-foreground font-semibold text-sm shadow-sm backdrop-blur-sm">
            Browse my files
            <input type="file" accept=".mp3,.wav,.m4a,.aac,.ogg" className="hidden" onChange={(e) => {
              handleUpload(e);
              // Wait a tiny bit then auto-process since there's no "extract" button now
              setTimeout(() => {
                 // We need to pass the event but React state handles it. 
                 // Actually, processAudio needs the file state to be updated first.
                 // We will just show a processing button if they select a file.
              }, 0);
            }} />
          </label>
        </div>
      )}

      {file && !isProcessing && !instrumentalUrl && (
        <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500 max-w-2xl mx-auto">
          <h1 className="text-3xl font-black tracking-tight mb-4 text-foreground">
            Ready to split
          </h1>
          <p className="text-secondary mb-8">{file.name}</p>
          <button
            onClick={processAudio}
            className="px-10 py-4 rounded-full bg-[#38bdf8] text-white font-black text-lg hover:bg-[#0ea5e9] transition-colors shadow-lg shadow-sky-900/50 flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            Extract Instrumental
          </button>
        </div>
      )}

      {isProcessing && (
        <div className="flex flex-col items-center text-center py-8 animate-in fade-in duration-300 max-w-md w-full">
          <div className="w-20 h-20 rounded-full border-4 border-edge/30 border-t-[#38bdf8] animate-spin mb-6" />
          <h3 className="font-bold text-xl mb-2">Analyzing Frequencies...</h3>
          <p className="text-muted text-sm mb-6 text-center">Using advanced DSP phase-cancellation to isolate and remove center-panned vocals.</p>
          
          <div className="w-full h-3 bg-control rounded-full overflow-hidden border border-edge/20">
            <div 
              className="h-full bg-gradient-to-r from-[#38bdf8] to-[#818cf8] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {instrumentalUrl && !isProcessing && (
        <div className="flex flex-col items-center w-full max-w-lg bg-panel backdrop-blur-md p-8 rounded-3xl border border-edge/20 shadow-xl animate-in fade-in slide-in-from-bottom-4">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-2xl font-black mb-1">Vocals Removed!</h2>
          <p className="text-secondary text-sm mb-8">Your instrumental karaoke track is ready.</p>

          <div className="flex items-center gap-4 w-full mb-6">
            <button
              onClick={togglePlayback}
              className="w-16 h-16 shrink-0 rounded-full flex items-center justify-center transition-all bg-[#10b981] text-white hover:bg-[#059669] shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:scale-105"
            >
              {isPlaying ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
            </button>

            <button
              onClick={downloadTrack}
              className="flex-1 h-16 rounded-xl flex items-center justify-center gap-2 bg-control hover:bg-control-hover border border-edge/20 text-foreground font-bold transition-all hover:scale-[1.02]"
            >
              <Download className="w-5 h-5" />
              Download MP3
            </button>
          </div>

          <button
            onClick={() => {
              setInstrumentalUrl(null);
              setFile(null);
            }}
            className="text-red-400 hover:text-red-300 text-sm font-bold flex items-center gap-2 transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
            Split Another Song
          </button>

          <audio 
            ref={audioRef} 
            src={instrumentalUrl} 
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />
        </div>
      )}


      </div>

      {!file && !isProcessing && (
        <div id="how-it-works" className="min-h-[60vh] flex flex-col items-center justify-center p-8 bg-panel/30 border-t border-edge/20">
          <div className="max-w-3xl mx-auto w-full">
            <h2 className="text-3xl font-black mb-12 text-center">How to use Vocal Remover</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 bg-panel rounded-2xl border border-edge/20 shadow-sm">
                <div className="w-12 h-12 bg-[#38bdf8]/10 text-[#38bdf8] rounded-full flex items-center justify-center font-bold text-xl mb-4">1</div>
                <h3 className="font-bold mb-2">Upload Audio</h3>
                <p className="text-secondary text-sm">Select any MP3, WAV, or M4A file from your device. We process it entirely locally in your browser.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-panel rounded-2xl border border-edge/20 shadow-sm">
                <div className="w-12 h-12 bg-[#38bdf8]/10 text-[#38bdf8] rounded-full flex items-center justify-center font-bold text-xl mb-4">2</div>
                <h3 className="font-bold mb-2">Fast Processing</h3>
                <p className="text-secondary text-sm">Our algorithm mutes center vocals instantly, leaving just enough of the artist's pitch to guide your singing.</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 bg-panel rounded-2xl border border-edge/20 shadow-sm">
                <div className="w-12 h-12 bg-[#38bdf8]/10 text-[#38bdf8] rounded-full flex items-center justify-center font-bold text-xl mb-4">3</div>
                <h3 className="font-bold mb-2">Download</h3>
                <p className="text-secondary text-sm">Listen to the preview and download your new instrumental karaoke track instantly.</p>
              </div>
            </div>

          <div className="flex justify-center mt-12">
            <button onClick={() => document.getElementById("top")?.scrollIntoView({ behavior: "smooth" })} className="px-6 py-2 rounded-full bg-edge/20 hover:bg-edge/40 text-foreground text-sm font-bold transition-all flex items-center gap-2">
              ↑ Back to top
            </button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
