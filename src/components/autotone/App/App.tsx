import { useEffect, useState } from 'react';
import { Autotoner } from '../../../lib/autotone/autotone/Autotoner';
import { Player } from '../Player/Player';
import { Record } from '../Record/Record';
import { Settings } from '../Settings/Settings';
import { ProcessingOverlay } from '../../shared/ProcessingOverlay';
import { Text } from '../shared/Text/Text';
import styles from './App.module.css';
import { useUnsavedChanges } from "@/providers/UnsavedChangesProvider";

const autotoner = new Autotoner();

export const App = () => {
  const { setHasUnsavedChanges } = useUnsavedChanges();
  
  const [isReady, setIsReady] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMicAccessible, setIsMicAccessible] = useState(true);
  const [originalAudio, setOriginalAudio] = useState(null);
  const [autotonedAudio, setAutotonedAudio] = useState(null);

  useEffect(() => {
    setHasUnsavedChanges(originalAudio !== null || autotonedAudio !== null);
  }, [originalAudio, autotonedAudio, setHasUnsavedChanges]);

  const [isUploadReady, setIsUploadReady] = useState(false);
  const [hasEnteredEditor, setHasEnteredEditor] = useState(false);

  useEffect(() => {
    autotoner
      .init()
      .then(() => setIsReady(true))
      .catch(() => setIsMicAccessible(false));
      
    autotoner.initUpload().then(() => setIsUploadReady(true));
  }, []);

  const record = () => {
    setHasEnteredEditor(true);
    setIsRecording(true);
    setOriginalAudio(null);
    setAutotonedAudio(null);
    autotoner.record();
  };

  const stopRecording = async () => {
    setIsRecording(false);
    setIsProcessing(true);
    try {
      await autotoner.stopRecording();
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Processing failed");
    } finally {
      setIsProcessing(false);
      setOriginalAudio(autotoner.getOriginalAudio());
      setAutotonedAudio(autotoner.getAutotonedAudio());
    }
  };

  const handleUpload = async (file: File) => {
    setHasEnteredEditor(true);
    setError(null);
    setOriginalAudio(null);
    setAutotonedAudio(null);
    setIsProcessing(true);
    try {
      await autotoner.loadAudio(file);
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Upload processing failed");
    } finally {
      setIsProcessing(false);
      setOriginalAudio(autotoner.getOriginalAudio());
      setAutotonedAudio(autotoner.getAutotonedAudio());
    }
  };

  const reAutotone = async () => {
    setError(null);
    setOriginalAudio(null);
    setAutotonedAudio(null);
    setIsProcessing(true);
    try {
      await autotoner.autotone();
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Processing failed");
    } finally {
      setIsProcessing(false);
      setOriginalAudio(autotoner.getOriginalAudio());
      setAutotonedAudio(autotoner.getAutotonedAudio());
    }
  };

  return (
    <div className="flex-1 w-full h-full bg-background flex flex-col relative min-h-0">
      {!hasEnteredEditor ? (
        <div className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar w-full h-full relative z-10">
          <div className="w-full flex flex-col items-center justify-center min-h-[100dvh] pt-16">
            <div className="flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500 max-w-2xl mx-auto p-4">
              <div className="flex items-center gap-6 mb-12 text-sm font-bold tracking-widest text-secondary uppercase">
                <span className="pb-1 flex items-center gap-2">Pitch Correction</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black mb-4 tracking-tight font-sans">Autotune</h1>
              <p className="text-secondary text-base md:text-lg mb-10 max-w-xl font-sans">
                A vocal pitch correction web application. Record your voice or upload an audio file.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <label className={`px-8 py-3 flex items-center justify-center gap-2 rounded-full font-bold text-sm shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-opacity ${!isUploadReady ? 'bg-foreground/50 text-background/50 cursor-not-allowed' : 'bg-foreground text-background hover:opacity-90 cursor-pointer'}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  {!isUploadReady ? 'Loading...' : 'Browse my files'}
                  <input type="file" accept="audio/*" className="hidden" disabled={!isUploadReady} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                  }} />
                </label>
                <button onClick={() => setHasEnteredEditor(true)} className="px-8 py-3 flex items-center justify-center gap-2 rounded-full border border-edge/40 hover:bg-control cursor-pointer transition-colors text-foreground font-semibold text-sm shadow-sm backdrop-blur-sm font-sans">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></svg>
                  Open Editor
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`${styles.container} relative`}>
          <ProcessingOverlay isVisible={isProcessing} text="Tuning & Processing audio..." />
          <div className={styles.header}>
            <div className={styles.headerText}>
              <Text className={styles.title}>
                Autotone
              </Text>
              <Text className={styles.description}>
                A vocal pitch correction web application
              </Text>
            </div>
            <a className={styles.link} href="https://github.com/alexcrist/autotone" target="_blank">
              the code
            </a>
          </div>
          <div className={styles.row}>
            <Record
              isReady={isReady}
              isUploadReady={isUploadReady}
              isRecording={isRecording}
              isProcessing={isProcessing}
              isMicAccessible={isMicAccessible}
              error={error}
              record={() => {
                setError(null);
                record();
              }}
              stopRecording={stopRecording}
              handleUpload={handleUpload}
            />
            <Settings 
              originalAudio={originalAudio}
              isProcessing={isProcessing}
              reAutotone={reAutotone}
              getAutotoner={() => autotoner}
            />
          </div>
          <Player
            title='Original audio'
            audio={originalAudio}
            getSampleRate={() => autotoner.getSampleRate()}
            getFreqs={() => autotoner.getOriginalFreqs()}
            getConfidences={() => autotoner.getConfidences()}
            isProcessing={isProcessing}
            color='#0049B6'
          />
          <Player
            title='Autotoned audio'
            audio={autotonedAudio}
            getSampleRate={() => autotoner.getSampleRate()}
            getFreqs={() => autotoner.getAutotonedFreqs()}
            getConfidences={() => autotoner.getConfidences()}
            isProcessing={isProcessing}
            color='#FF1D58'
          />
        </div>
      )}
    </div>
  );
};
