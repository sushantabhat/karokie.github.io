/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
"use client";
import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RegionsPlugin from 'wavesurfer.js/dist/plugins/regions.esm.js';
import TimelinePlugin from 'wavesurfer.js/dist/plugins/timeline.esm.js';
import { Play, Pause, ZoomIn, ZoomOut } from 'lucide-react';

export type LineSync = {
  id: string;
  text: string;
  start: number | null;
  end: number | null;
};

interface WaveformEditorProps {
  trackUrl: string;
  lyrics: LineSync[];
  onUpdateLine: (id: string, start: number | null, end: number | null) => void;
  theme: 'dark' | 'light';
}

const getColors = (theme: 'dark' | 'light') =>
  theme === 'light'
    ? { wave: '#0284C7', progress: '#0ea5e9', cursor: '#fb7185', timeline: '#64748B' }
    : { wave: '#00E5FF', progress: '#38bdf8', cursor: '#fb7185', timeline: '#71717a' };

// Fallback for drag data across shadow boundaries
let activeDraggedLineId: string | null = null;

export default function WaveformEditor({ trackUrl, lyrics, onUpdateLine, theme }: WaveformEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const regions = useRef<RegionsPlugin | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(50);
  const [isReady, setIsReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hoveredInfo, setHoveredInfo] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentIndex = React.useMemo(() => {
    let idx = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].start !== null && currentTime >= lyrics[i].start!) {
        idx = i;
      }
    }
    return idx;
  }, [lyrics, currentTime]);

  const activeLyric = React.useMemo(() => {
    if (currentIndex === -1) return null;
    const line = lyrics[currentIndex];
    if (line.end !== null && currentTime > line.end) return null;
    return line;
  }, [currentIndex, lyrics, currentTime]);

  const focusIndex = currentIndex === -1 ? 0 : currentIndex;

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current) return;

    try {
const colors = getColors(theme);
      wavesurfer.current = WaveSurfer.create({
        container: containerRef.current,
        waveColor: colors.wave,
        progressColor: colors.progress,
        cursorColor: colors.cursor,
        cursorWidth: 2,
        height: 180,
        normalize: true,
        minPxPerSec: zoom,
        dragToSeek: true,
        interact: true,
      });

      regions.current = wavesurfer.current.registerPlugin(RegionsPlugin.create());
      wavesurfer.current.registerPlugin(TimelinePlugin.create({
        height: 20,
        timeInterval: 5,
        primaryLabelInterval: 10,
        style: {
          fontSize: '10px',
          color: colors.timeline,
        },
      }));

      if (trackUrl) {
        wavesurfer.current.load(trackUrl).catch((err: any) => {
          if (err && err.name !== 'AbortError') {
             console.error('WaveSurfer load error:', err);
             setErrorMsg(err?.message || String(err));
          }
        });
      }

      wavesurfer.current.on('ready', () => {
        setIsReady(true);
        if (wavesurfer.current) {
          setDuration(wavesurfer.current.getDuration());
          
          // Forcefully inject handles directly into the Shadow DOM cursor element
          const shadowRoot = containerRef.current?.shadowRoot;
          if (shadowRoot) {
            const cursor = shadowRoot.querySelector('[part="cursor"]') as HTMLElement;
            if (cursor) {
              cursor.style.overflow = 'visible';
              cursor.style.zIndex = '9999';
              cursor.style.pointerEvents = 'auto';
              cursor.innerHTML = `
                <div style="position: absolute; top: -2px; left: 50%; transform: translateX(-50%); width: 14px; height: 14px; background-color: #fb7185; border: 2px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.8); pointer-events: auto; cursor: ew-resize; z-index: 9999;"></div>
                <div style="position: absolute; bottom: -2px; left: 50%; transform: translateX(-50%); width: 14px; height: 14px; background-color: #fb7185; border: 2px solid #ffffff; border-radius: 50%; box-shadow: 0 2px 6px rgba(0,0,0,0.8); pointer-events: auto; cursor: ew-resize; z-index: 9999;"></div>
              `;
            }
          }
        }
      });

      wavesurfer.current.on('play', () => setIsPlaying(true));
      wavesurfer.current.on('pause', () => setIsPlaying(false));
      wavesurfer.current.on('timeupdate', (time: number) => setCurrentTime(time));
      wavesurfer.current.on('seeking', (time: number) => setCurrentTime(time));
      wavesurfer.current.on('audioprocess', (time: number) => setCurrentTime(time));
      wavesurfer.current.on('error', (err: any) => {
        console.error('WaveSurfer error:', err);
        setErrorMsg(err?.message || String(err));
      });
    } catch (err: any) {
      console.error('Init error:', err);
      setErrorMsg(err?.message || String(err));
    }

    return () => {
      try {
        wavesurfer.current?.destroy();
      } catch (err) {}
    };
  }, [trackUrl]);

  useEffect(() => {
    if (!wavesurfer.current) return;
    const colors = getColors(theme);
    wavesurfer.current.setOptions({ waveColor: colors.wave, progressColor: colors.progress });
  }, [theme]);

  // Update Zoom
  useEffect(() => {
    if (wavesurfer.current && isReady) {
      wavesurfer.current.zoom(zoom);
    }
  }, [zoom, isReady]);

  // Sync Regions with Lyrics state
  useEffect(() => {
    if (!isReady || !regions.current) return;

    const existingRegions = regions.current.getRegions();
    const validLineIds = new Set(lyrics.filter(l => l.start !== null).map(l => `line-${l.id}`));

    // Remove deleted or unsynced regions
    existingRegions.forEach(r => {
      if (r.id.startsWith('line-') && !validLineIds.has(r.id)) {
        r.remove();
      }
    });

    lyrics.forEach((line, i) => {
      // Only render lines that have been synced!
      if (line.start === null) return;

      const wStart = line.start;
      let wEnd = line.end;
      
      // If end is null (e.g. the very last stamped line), guess the end time based on the next line or add 2 seconds
      if (wEnd === null) {
        const nextLine = lyrics.slice(i + 1).find(l => l.start !== null);
        if (nextLine && nextLine.start !== null) {
          wEnd = nextLine.start;
        } else {
          wEnd = wStart + 2.0; 
        }
      }

      // Safeguard: Ensure end is strictly greater than start to avoid region crashing
      if (wEnd <= wStart) {
        wEnd = wStart + 0.5;
      }

      const regionId = `line-${line.id}`;
      const existing = existingRegions.find(r => r.id === regionId);

      if (existing) {
        // Update if significantly different (avoids interrupting active drags)
        if (Math.abs(existing.start - wStart) > 0.05 || Math.abs(existing.end - wEnd) > 0.05) {
          existing.setOptions({ start: wStart, end: wEnd });
        }
      } else {
        const contentEl = document.createElement('div');
        contentEl.title = "Double-click to unsync (return to Waiting Box)";
        contentEl.style.cssText = 'position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: flex-start; padding: 0 4px; box-sizing: border-box; overflow: hidden; pointer-events: none; border-left: 2px solid rgba(255,255,255,0.4); border-right: 2px solid rgba(255,255,255,0.4);'; 
        
        const numSpan = document.createElement('span');
        numSpan.innerText = `${i + 1}.`;
        numSpan.style.cssText = 'color: rgba(255,255,255,0.7); font-size: 11px; font-weight: bold; font-family: monospace; margin-right: 4px; flex-shrink: 0; pointer-events: none; text-shadow: 0 1px 2px rgba(0,0,0,0.8);';
        
        const textSpan = document.createElement('span');
        textSpan.innerText = line.text;
        textSpan.style.cssText = 'color: #fff; font-size: 14px; font-weight: bold; text-shadow: 0 1px 3px rgba(0,0,0,0.9); white-space: nowrap; text-overflow: ellipsis; overflow: hidden; max-width: 100%; pointer-events: none;';
        
        contentEl.appendChild(numSpan);
        contentEl.appendChild(textSpan);

        // Alternate region background colors to clearly separate them
        const regionColor = i % 2 === 0 ? 'rgba(236, 72, 153, 0.3)' : 'rgba(168, 85, 247, 0.3)'; // Pink vs Purple

        regions.current!.addRegion({
          start: wStart,
          end: wEnd,
          content: contentEl,
          color: regionColor,
          drag: true,
          resize: true,
          id: regionId
        });
      }
    });
  }, [isReady, lyrics]);

  // Bind events exactly once when ready
  useEffect(() => {
    if (!isReady || !regions.current) return;
    
    // We use region-update instead of region-updated for real-time collision pushing!
    const onRegionUpdate = (region: any) => {
      if (region.id.startsWith('line-')) {
        const id = region.id.replace('line-', '');
        onUpdateLine(id, region.start, region.end);
      }
    };

    regions.current.on('region-update', onRegionUpdate);
    
    // Double click to unsync
    const onRegionDoubleClick = (region: any, e: MouseEvent) => {
      e.stopPropagation(); // prevent seek
      if (region.id.startsWith('line-')) {
        const id = region.id.replace('line-', '');
        onUpdateLine(id, null, null);
      }
    };
    regions.current.on('region-double-clicked', onRegionDoubleClick);

    return () => {
      regions.current?.un('region-update', onRegionUpdate);
      regions.current?.un('region-double-clicked', onRegionDoubleClick);
    };
  }, [isReady]); // We rely on onUpdateLine being stable or using refs if necessary


  const togglePlay = () => {
    wavesurfer.current?.playPause();
  };

  return (
    <div className="flex flex-col md:flex-row h-full border border-edge/20 light:border-edge bg-panel rounded-lg shadow-sm overflow-hidden">
      
      {/* WAITING BOX (Left Sidebar) */}
      <div className="w-full md:w-64 border-r border-edge/20 light:border-edge flex flex-col bg-background shrink-0 max-h-36 md:max-h-none shrink-0">
        <div className="p-2.5 md:p-3 border-b border-edge/20 light:border-edge">
          <h3 className="font-bold text-sm text-foreground">Waiting Box</h3>
          <p className="text-xs text-secondary hidden md:block">Drag to timeline to sync</p>
          <p className="text-xs text-secondary md:hidden">Tap a card, then tap the timeline to place it</p>
        </div>
        <div 
          className="flex-1 overflow-hidden p-2 flex md:flex-col gap-2 custom-scrollbar overflow-x-auto md:overflow-y-auto"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const lineId = e.dataTransfer.getData('text/plain');
            if (lineId) onUpdateLine(lineId, null, null);
          }}
        >
          {lyrics.filter(l => l.start === null).length === 0 ? (
            <div className="text-center p-4 text-xs font-mono text-secondary">All lyrics placed!</div>
          ) : (
            lyrics.map((line, index) => ({...line, index})).filter(l => l.start === null).map(line => (
              <div
                key={line.id}
                draggable={true}
                onDragStart={(e) => {
                  e.dataTransfer.setData('text/plain', line.id);
                  e.dataTransfer.setData('application/json', JSON.stringify({ id: line.id, text: line.text }));
                  e.dataTransfer.effectAllowed = 'move';
                  activeDraggedLineId = line.id;
                  
                  if (containerRef.current) containerRef.current.style.pointerEvents = 'none';
                  
                  if (dropZoneRef.current) {
                    dropZoneRef.current.style.opacity = '1';
                  }
                }}
                onDragEnd={() => {
                  setTimeout(() => { 
                    activeDraggedLineId = null; 
                    if (containerRef.current) containerRef.current.style.pointerEvents = 'auto';
                    if (dropZoneRef.current) {
                      dropZoneRef.current.style.opacity = '0';
                    }
                  }, 100);
                }}
                onClick={() => {
                  if (window.matchMedia('(pointer: coarse)').matches) {
                    onUpdateLine(line.id, null, null);
                  }
                }}
                className="p-3 md:p-3 bg-control border border-edge rounded cursor-grab hover:bg-control-hover active:cursor-grabbing transition-colors group flex gap-3 items-start shrink-0 w-40 md:w-auto snap-start"
                title="Drag onto the waveform"
              >
                <span className="text-[11px] font-mono font-bold text-[#38bdf8] opacity-60 mt-0.5 shrink-0 w-4">{line.index + 1}.</span>
                <span className="text-sm font-bold text-foreground line-clamp-2">{line.text}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MAIN EDITOR AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {errorMsg && (
          <div className="bg-red-500/20 text-red-400 p-2 text-xs font-mono border-b border-red-500/50 shrink-0">
            Error: {errorMsg}
          </div>
        )}
        <div className="p-2 md:p-3 border-b border-edge/20 light:border-edge flex items-center justify-between shrink-0 gap-1 md:gap-2">
          <h3 className="font-bold text-foreground flex items-center gap-2 text-sm shrink-0 pr-2">
            <span className="text-[#38bdf8] hidden sm:inline">Global Timeline</span><span className="text-[#38bdf8] sm:hidden">Timeline</span>
          </h3>
          <div className="flex items-center gap-1 md:gap-4 flex-1 justify-end overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 px-2 md:px-3 py-1 bg-background rounded-full border border-edge/20 light:border-edge shrink-0">
              <span className="text-[10px] md:text-xs font-mono text-[#38bdf8]">{formatTime(currentTime)}</span>
              <span className="text-[10px] md:text-xs font-mono text-secondary hidden sm:inline">/ {formatTime(duration)}</span>
            </div>
            <div className="flex items-center gap-0.5 md:gap-2 shrink-0">
              <button onClick={() => setZoom(z => Math.max(10, z - 20))} className="p-1 md:p-1.5 text-muted hover:text-foreground rounded hover:bg-control" aria-label="Zoom out">
                <ZoomOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
              <span className="text-[10px] md:text-xs font-mono text-secondary w-8 md:w-12 text-center">{zoom}px</span>
              <button onClick={() => setZoom(z => Math.min(300, z + 20))} className="p-1 md:p-1.5 text-muted hover:text-foreground rounded hover:bg-control" aria-label="Zoom in">
                <ZoomIn className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
            <div className="h-4 w-px bg-control mx-1 md:mx-0 shrink-0" />
            <button onClick={togglePlay} className="w-7 h-7 md:w-8 md:h-8 shrink-0 flex items-center justify-center bg-foreground text-background rounded-full hover:bg-[#0ea5e9] transition-colors">
              {isPlaying ? <Pause className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" /> : <Play className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current ml-0.5" />}
            </button>
          </div>
        </div>
        
        {/* Cinematic Scrolling Lyric Screen (Apple Music Style) */}
        <div className="h-36 md:h-48 shrink-0 bg-background border-b border-edge/20 light:border-edge overflow-hidden relative flex flex-col items-center justify-start">

          {/* Scroll Masks */}
          <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#09090b] light:from-[#F1F5F9] to-transparent z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#09090b] light:from-[#F1F5F9] to-transparent z-10 pointer-events-none" />

          {/* Rolling Lyrics Container */}
          <div 
            className="flex flex-col items-center w-full transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
            style={{ transform: `translateY(${-(focusIndex * 48)}px)`, marginTop: '72px' }}
          >
            {lyrics.length === 0 ? (
              <div className="h-[48px] flex items-center justify-center w-full text-sm font-mono text-secondary italic">No synced lyrics...</div>
            ) : (
              lyrics.map((line, idx) => {
                const isActive = activeLyric && activeLyric.id === line.id;
                const isPast = idx < focusIndex;
                
                return (
                  <div 
                    key={line.id}
                    className={`h-[48px] flex flex-col items-center justify-center w-full px-4 md:px-8 transition-all duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] ${
                      isActive 
                        ? 'scale-100 opacity-100' 
                        : isPast
                          ? 'scale-95 opacity-40'
                          : 'scale-95 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 max-w-full justify-center">
                      <span className={`font-mono shrink-0 ${isActive ? 'text-xl text-[#38bdf8] light:text-[#0369a1] opacity-50' : 'text-sm text-secondary opacity-50'}`}>{idx + 1}.</span>
                      <span className={`truncate text-center ${isActive ? 'text-xl md:text-3xl font-black text-foreground font-semibold drop-shadow-sm' : isActive === false && isPast ? 'text-base md:text-xl font-bold text-edge light:text-slate-400' : 'text-base md:text-xl font-bold text-secondary'}`}>
                        {line.text}
                      </span>
                    </div>
                    {isActive && (
                      <span className="text-xs font-mono text-[#38bdf8] light:text-[#0369a1] opacity-80 mt-1 animate-in fade-in zoom-in duration-300">
                        {line.start !== null ? line.start.toFixed(2) : '0.00'}s - {line.end !== null ? line.end.toFixed(2) : '...'}s
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div 
          className="flex-1 p-2 md:p-4 overflow-hidden flex flex-col relative"
          onDragEnter={(e) => { e.preventDefault(); }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            // Move shadow projectile
            if (dropZoneRef.current && containerRef.current) {
              const waveRect = containerRef.current.getBoundingClientRect();
              const dropX = Math.max(0, Math.min(e.clientX - waveRect.left, waveRect.width));
              const cursor = dropZoneRef.current.querySelector('.drop-cursor') as HTMLDivElement;
              if (cursor) {
                cursor.style.transform = `translateX(${dropX}px)`;
              }
            }
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (containerRef.current) containerRef.current.style.pointerEvents = 'auto';
            if (dropZoneRef.current) {
              dropZoneRef.current.style.opacity = '0';
            }
            
            let lineId = activeDraggedLineId;
            try {
              const payload = e.dataTransfer.getData('application/json');
              if (payload) {
                const data = JSON.parse(payload);
                if (data && data.id) lineId = data.id;
              }
            } catch (err) {}
            
            if (!lineId && e.dataTransfer) {
              lineId = e.dataTransfer.getData('text/plain') || lineId;
            }

            if (!lineId) return;

            if (!containerRef.current) return;
            const waveRect = containerRef.current.getBoundingClientRect();
            // Accuracy fix: use the waveform's rect, not the padded wrapper
            const dropX = Math.max(0, e.clientX - waveRect.left);
            
            let scrollLeft = 0;
            let scrollWidth = waveRect.width || 1;
            
            try {
              const ws = wavesurfer.current;
              if (ws) {
                const wrapper = ws.getWrapper();
                const scrollEl = wrapper.shadowRoot ? (wrapper.shadowRoot.querySelector('.scroll') || wrapper) : wrapper;
                scrollLeft = scrollEl.scrollLeft || 0;
                scrollWidth = Math.max(scrollEl.scrollWidth, waveRect.width, 1);
              }
            } catch (err) {
              console.warn('Could not read wavesurfer scroll data', err);
            }

            const totalDur = wavesurfer.current?.getDuration() || duration || 0;
            if (totalDur === 0) return;

            let startTime = ((dropX + scrollLeft) / scrollWidth) * totalDur;
            
            if (isNaN(startTime) || !isFinite(startTime)) {
              startTime = (dropX / (waveRect.width || 1)) * totalDur;
            }
            
            startTime = Math.max(0, Math.min(startTime, totalDur - 0.5));
            onUpdateLine(lineId, startTime, startTime + 2.0);
          }}
        >
          <div 
            ref={dropZoneRef}
            className="absolute inset-4 z-50 bg-edge/10 light:bg-slate-100 border-2 border-dashed border-[#38bdf8] rounded backdrop-blur-[1px] pointer-events-none transition-opacity duration-200 overflow-hidden"
            style={{ opacity: 0 }}
          >
            <div className="flex items-center justify-center w-full h-full">
              <span className="text-[#38bdf8] font-bold text-lg drop-shadow-md bg-black/40 px-4 py-2 rounded-full">Drop here to sync</span>
            </div>
            
            {/* Shadow Projectile */}
            <div 
              className="drop-cursor absolute top-0 bottom-0 w-[2px] bg-foreground shadow-[0_0_12px_#38bdf8] z-10 origin-top"
              style={{ left: 0 }}
            >
              <div className="absolute top-0 left-0 px-2 py-1 bg-foreground text-background text-[10px] font-bold rounded-b whitespace-nowrap -translate-x-1/2">
                Drop Time
              </div>
            </div>
          </div>
          
          <div 
            ref={containerRef} 
            className="waveform-container w-full flex-1 rounded bg-background border border-edge/20 light:border-edge custom-scrollbar overflow-y-auto"
          />
        </div>
      </div>
    </div>
  );
}
