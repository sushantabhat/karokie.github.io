'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Download, Trash2, Sparkles, Ghost, Radio, Mic2 } from 'lucide-react';
import { audioBufferToMp3 } from '@/utils/audioBufferToMp3';

type EffectType = 'normal' | 'chipmunk' | 'monster' | 'robot' | 'radio' | 'alien' | 'cave' | 'studio';

const EFFECTS: { id: EffectType; name: string; icon: string }[] = [
  { id: 'normal', name: 'Normal', icon: '🎙️' },
  { id: 'studio', name: 'Studio Pro', icon: '✨' },
  { id: 'chipmunk', name: 'Chipmunk', icon: '🐿️' },
  { id: 'monster', name: 'Monster', icon: '👹' },
  { id: 'robot', name: 'Robot', icon: '🤖' },
  { id: 'radio', name: 'Walkie-Talkie', icon: '📻' },
  { id: 'cave', name: 'Cave / Ghost', icon: '👻' },
  { id: 'alien', name: 'Alien', icon: '👽' },
];

function makeDistortionCurve(amount = 50) {
  const k = typeof amount === 'number' ? amount : 50;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

export default function VoiceChangerTool() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [activeEffect, setActiveEffect] = useState<EffectType>('normal');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const currentCleanupsRef = useRef<Array<() => void>>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  const drawWaveform = () => {
    if (!analyserRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteTimeDomainData(dataArray);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    animationFrameRef.current = requestAnimationFrame(drawWaveform);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      // Set up visualizer for mic input
      if (audioContextRef.current) {
         if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
         const source = audioContextRef.current.createMediaStreamSource(stream);
         const analyser = audioContextRef.current.createAnalyser();
         analyser.fftSize = 2048;
         source.connect(analyser);
         analyserRef.current = analyser;
         drawWaveform();
      }

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach(t => t.stop());
        cancelAnimationFrame(animationFrameRef.current);
        if (canvasRef.current) {
           const ctx = canvasRef.current.getContext('2d');
           ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      setRecordedBlob(null);
    } catch (err: any) {
      console.error("Mic access denied", err);
      if (!navigator.mediaDevices) {
         setMicError("Microphone access is blocked because your connection is not secure. You must use HTTPS (or localhost) to record audio.");
      } else {
         setMicError(`Microphone access failed: ${err.message || err.name || 'Permission Denied'}.\n\nPlease ensure you have granted microphone permissions in your browser settings and refresh the page.`);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const stopPlayback = () => {
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (e) {}
      currentSourceRef.current = null;
    }
    currentCleanupsRef.current.forEach(cleanup => cleanup());
    currentCleanupsRef.current = [];
    setIsPlaying(false);
    cancelAnimationFrame(animationFrameRef.current);
    if (canvasRef.current) {
       const ctx = canvasRef.current.getContext('2d');
       ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const applyEffectToNode = async (
    ctx: BaseAudioContext, 
    source: AudioBufferSourceNode, 
    effect: EffectType, 
    cleanups: Array<() => void>
  ): Promise<AudioNode> => {
    let lastNode: AudioNode = source;

    if (effect === 'chipmunk') {
      source.playbackRate.value = 1.6;
    } else if (effect === 'monster') {
      source.playbackRate.value = 0.6;
      const eq = ctx.createBiquadFilter();
      eq.type = 'lowshelf';
      eq.frequency.value = 200;
      eq.gain.value = 10;
      lastNode.connect(eq);
      lastNode = eq;
    } else if (effect === 'robot') {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = 40;
      const gain = ctx.createGain();
      
      // We want to ring modulate: output = source * osc
      // In Web Audio, connecting an oscillator to a gain.gain parameter 
      // multiplies the incoming signal by the oscillator's value.
      lastNode.connect(gain);
      osc.connect(gain.gain);
      osc.start();
      cleanups.push(() => osc.stop());
      lastNode = gain;
    } else if (effect === 'radio') {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1200;
      bp.Q.value = 1;
      
      const dist = ctx.createWaveShaper();
      dist.curve = makeDistortionCurve(50);
      dist.oversample = '4x';
      
      lastNode.connect(bp);
      bp.connect(dist);
      lastNode = dist;
    } else if (effect === 'alien') {
      // True Alien: 100% wet vibrato + gargle. 
      // Restored the original crazy sci-fi vibe, but halved the pitch-warp depth so words are intelligible.
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.05;
      
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 5; // Slightly slower wobble for clarity
      
      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.004; // Dialed down just a tiny bit more for perfect intelligibility
      
      osc.connect(oscGain);
      oscGain.connect(delay.delayTime);
      osc.start();
      cleanups.push(() => osc.stop());
      
      lastNode.connect(delay);
      lastNode = delay;
    } else if (effect === 'cave') {
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.3;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.4;
      
      const mix = ctx.createGain();
      
      lastNode.connect(mix); // dry
      lastNode.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(mix); // wet
      
      lastNode = mix;
    } else if (effect === 'studio') {
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -30;
      comp.knee.value = 10;
      comp.ratio.value = 4;
      comp.attack.value = 0.01;
      comp.release.value = 0.1;
      
      const eq = ctx.createBiquadFilter();
      eq.type = 'lowshelf';
      eq.frequency.value = 150;
      eq.gain.value = 5;
      
      const eqHigh = ctx.createBiquadFilter();
      eqHigh.type = 'highshelf';
      eqHigh.frequency.value = 8000;
      eqHigh.gain.value = 3;
      
      lastNode.connect(comp);
      comp.connect(eq);
      eq.connect(eqHigh);
      lastNode = eqHigh;
    }

    return lastNode;
  };

  const playWithEffect = async () => {
    if (!recordedBlob || !audioContextRef.current) return;
    
    stopPlayback();
    
    try {
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') await ctx.resume();
      
      const arrayBuffer = await recordedBlob.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      currentSourceRef.current = source;
      
      const cleanups: Array<() => void> = [];
      const finalNode = await applyEffectToNode(ctx, source, activeEffect, cleanups);
      currentCleanupsRef.current = cleanups;
      
      // Add visualizer for playback
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      finalNode.connect(analyser);
      analyser.connect(ctx.destination);
      analyserRef.current = analyser;
      drawWaveform();

      source.onended = () => {
        stopPlayback();
      };

      source.start();
      setIsPlaying(true);
    } catch (err) {
      console.error("Playback error:", err);
    }
  };

  const downloadEffect = async () => {
    if (!recordedBlob || !audioContextRef.current) return;
    setIsProcessing(true);
    try {
      const ctx = new OfflineAudioContext(2, 44100 * 300, 44100); // 5 minutes max
      const arrayBuffer = await recordedBlob.arrayBuffer();
      // Need a fresh context to decode because Offline context can't decode easily in some browsers
      const decodeCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await decodeCtx.decodeAudioData(arrayBuffer);
      
      // Re-create offline buffer length accurately
      const offlineCtx = new OfflineAudioContext(
        audioBuffer.numberOfChannels, 
        Math.ceil((audioBuffer.duration / (activeEffect === 'chipmunk' ? 1.6 : activeEffect === 'monster' ? 0.6 : 1)) * audioBuffer.sampleRate), 
        audioBuffer.sampleRate
      );

      const source = offlineCtx.createBufferSource();
      source.buffer = audioBuffer;

      const cleanups: Array<() => void> = [];
      const finalNode = await applyEffectToNode(offlineCtx, source, activeEffect, cleanups);
      finalNode.connect(offlineCtx.destination);
      
      source.start();
      const renderedBuffer = await offlineCtx.startRendering();
      cleanups.forEach(c => c());

      const mp3Blob = await await audioBufferToMp3(renderedBuffer);
      const url = URL.createObjectURL(mp3Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice_changer_${activeEffect}.mp3`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Export error:", e);
      alert("Failed to export. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div id="top" className="flex-1 overflow-y-auto bg-background pt-16 px-4 pb-4 md:p-8 scroll-smooth">
      <div className="max-w-4xl mx-auto space-y-8 min-h-screen flex flex-col justify-center">
        
        {/* Header */}
        
        {micError && (
          <div className="bg-[#ef4444] text-white p-4 rounded-xl shadow-lg animate-in slide-in-from-top-4 mb-4">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-lg mb-1">Microphone Blocked 🎤</h3>
              <button onClick={() => window.location.reload()} className="px-3 py-1 bg-black/20 hover:bg-black/30 rounded text-xs font-bold transition-colors">Reload Page</button>
            </div>
            <p className="text-sm whitespace-pre-wrap">{micError}</p>
          </div>
        )}

        <div className="flex flex-col items-center text-center max-w-2xl mx-auto pt-8 pb-12">
          <div className="flex items-center gap-6 mb-8 text-sm font-bold tracking-widest text-secondary uppercase">
            <button onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })} className="text-secondary hover:text-foreground transition-colors pb-1 flex items-center gap-2">How it works <span>↓</span></button>
          </div>

          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-foreground">
            Voice Changer
          </h1>
          <p className="text-lg md:text-xl text-secondary font-medium">
            Record your voice and apply fun studio effects instantly
          </p>
        </div>

        {/* Main Recorder UI */}
        <div className="bg-panel border border-edge/20 rounded-2xl p-6 md:p-10 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden min-h-[300px]">
          
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20 flex items-center justify-center">
             <canvas ref={canvasRef} width={800} height={200} className="w-full h-full object-cover" />
          </div>

          <div className="z-10 w-full flex flex-col items-center justify-center gap-6">
            {!recordedBlob ? (
              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-32 h-32 rounded-full flex flex-col items-center justify-center gap-2 transition-all duration-300 ${
                    isRecording 
                      ? 'bg-red-500 text-white shadow-[0_0_40px_rgba(239,68,68,0.6)] scale-110' 
                      : 'bg-control hover:bg-control-hover text-foreground shadow-lg hover:scale-105 border-2 border-transparent hover:border-red-500/50'
                  }`}
                >
                  {isRecording ? <Square className="w-10 h-10 fill-current" /> : <Mic className="w-10 h-10" />}
                  <span className="font-bold text-sm tracking-widest">{isRecording ? "STOP RECORDING" : "TAP TO RECORD"}</span>
                </button>
                {isRecording && <div className="text-red-400 font-bold animate-pulse mt-2">Recording... Tap to stop.</div>}
                {!isRecording && <div className="text-muted text-sm max-w-xs text-center mt-2">Tap the button, say something funny, and tap again when done!</div>}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-6 w-full max-w-lg bg-panel backdrop-blur-md p-6 rounded-2xl border border-edge/20 shadow-xl">
                
                {/* Playback Controls */}
                <div className="flex items-center gap-4 w-full">
                  <button
                    onClick={isPlaying ? stopPlayback : playWithEffect}
                    className={`w-16 h-16 shrink-0 rounded-full flex items-center justify-center transition-all ${
                      isPlaying 
                        ? 'bg-red-500 text-white hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.5)]' 
                        : 'bg-[#10b981] text-white hover:bg-[#059669] shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    }`}
                  >
                    {isPlaying ? <Square className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
                  </button>

                  <div className="flex-1 flex flex-col gap-2">
                    <button
                      onClick={downloadEffect}
                      disabled={isProcessing || isPlaying}
                      className="w-full py-3 px-4 bg-control hover:bg-control-hover text-foreground rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      {isProcessing ? "Processing..." : "Download MP3"}
                    </button>
                    
                    <button
                      onClick={() => {
                        stopPlayback();
                        setRecordedBlob(null);
                      }}
                      className="w-full py-2 px-4 bg-transparent hover:bg-red-500/10 text-red-400 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Discard & Record Again
                    </button>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Character Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {EFFECTS.map(effect => (
            <button
              key={effect.id}
              onClick={() => {
                setActiveEffect(effect.id);
                if (recordedBlob && !isPlaying) {
                  // If they select an effect, auto-play it for preview if we have a blob and aren't already playing!
                  // Let's rely on a separate play button click to prevent annoying auto-play.
                } else if (isPlaying) {
                  // Re-trigger play with new effect immediately
                  setTimeout(playWithEffect, 50);
                }
              }}
              className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border transition-all ${
                activeEffect === effect.id
                  ? 'bg-[#38bdf8]/10 border-[#38bdf8] shadow-[0_0_20px_rgba(56,189,248,0.15)] scale-105'
                  : 'bg-panel border-edge/20 hover:bg-control-hover hover:border-edge/50 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="text-4xl">{effect.icon}</div>
              <div className={`font-bold text-sm ${activeEffect === effect.id ? 'text-[#38bdf8]' : 'text-foreground'}`}>
                {effect.name}
              </div>
            </button>
          ))}
        </div>

        <div id="how-it-works" className="w-full max-w-4xl mx-auto mt-16 p-8 bg-panel/30 border-t border-edge/20 rounded-t-3xl">
          <h2 className="text-3xl font-black mb-12 text-center">How to use Voice Changer</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 bg-panel rounded-2xl border border-edge/20 shadow-sm">
              <div className="w-12 h-12 bg-[#38bdf8]/10 text-[#38bdf8] rounded-full flex items-center justify-center font-bold text-xl mb-4">1</div>
              <h3 className="font-bold mb-2">Record</h3>
              <p className="text-secondary text-sm">Allow microphone access and tap the big record button to capture your voice.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-panel rounded-2xl border border-edge/20 shadow-sm">
              <div className="w-12 h-12 bg-[#38bdf8]/10 text-[#38bdf8] rounded-full flex items-center justify-center font-bold text-xl mb-4">2</div>
              <h3 className="font-bold mb-2">Apply Effects</h3>
              <p className="text-secondary text-sm">Select any character from the grid (Robot, Chipmunk, Alien) to hear it instantly transformed.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 bg-panel rounded-2xl border border-edge/20 shadow-sm">
              <div className="w-12 h-12 bg-[#38bdf8]/10 text-[#38bdf8] rounded-full flex items-center justify-center font-bold text-xl mb-4">3</div>
              <h3 className="font-bold mb-2">Download</h3>
              <p className="text-secondary text-sm">Export your mutated voice as a high-quality MP3 file to share.</p>
            </div>
          </div>

          <div className="flex justify-center mt-12">
            <button onClick={() => document.getElementById("top")?.scrollIntoView({ behavior: "smooth" })} className="px-6 py-2 rounded-full bg-edge/20 hover:bg-edge/40 text-foreground text-sm font-bold transition-all flex items-center gap-2">
              ↑ Back to top
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
