import { useEffect, useState } from 'react';
import { Autotoner } from '../../../lib/autotone/autotone/Autotoner';
import { Player } from '../Player/Player';
import { Record } from '../Record/Record';
import { Settings } from '../Settings/Settings';
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

  useEffect(() => {
    autotoner
      .init()
      .then(() => setIsReady(true))
      .catch(() => setIsMicAccessible(false));
  }, []);

  const record = () => {
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
    <div className={styles.container}>
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
          isRecording={isRecording}
          isProcessing={isProcessing}
          isMicAccessible={isMicAccessible}
          error={error}
          record={() => {
            setError(null);
            record();
          }}
          stopRecording={stopRecording}
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
  );
};
