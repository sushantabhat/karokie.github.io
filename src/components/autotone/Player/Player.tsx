// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { FaDownload, FaPlay, FaStop } from 'react-icons/fa';
import * as player from '@/lib/autotone/player/player';
import { downloadWavFile } from '@/lib/autotone/utils/ioUtils';
import { Chart } from '../Chart/Chart';
import { Button } from '../shared/Button/Button';
import { Card } from '../shared/Card/Card';
import { Text } from '../shared/Text/Text';
import styles from './Player.module.css';

export const Player = ({ 
  title,
  audio,
  getFreqs,
  getConfidences,
  getSampleRate,
  getNumChannels,
  color,
 }: any) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackIdRef = useRef(0);
  const timeoutRef = useRef();
  useEffect(() => {
    if (!audio && isPlaying) {
      player.stop();
      setIsPlaying(false);
      playbackIdRef.current = 0;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setProgress(0);
    }
  }, [audio]);
  const [progress, setProgress] = useState(0);
  const playStartTime = useRef(0);
  const animationRef = useRef();

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      playbackIdRef.current = 0;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  if (!audio) {
    return null;
  }

  const audioDuration = audio.length / getSampleRate();

  const updateProgress = () => {
    const ctx = player.getAudioContext();
    if (ctx && playStartTime.current > 0) {
      const elapsed = ctx.currentTime - playStartTime.current;
      const newProgress = Math.min(elapsed / audioDuration, 1);
      setProgress(newProgress);
      if (newProgress < 1) {
        animationRef.current = requestAnimationFrame(updateProgress);
      }
    }
  };

  const onClickPlay = () => {
    if (isPlaying) {
      player.stop();
      setIsPlaying(false);
      playbackIdRef.current = 0;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      setProgress(0);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    } else {
      setIsPlaying(true);
      const currentId = ++playbackIdRef.current;
      setProgress(0);
      player.play(audio, getSampleRate(), () => {
        setIsPlaying(false);
        if (playbackIdRef.current === currentId) playbackIdRef.current = 0;
        setProgress(0);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      });
      // Start tracking time slightly after play to get accurate start
      timeoutRef.current = setTimeout(() => {
        if (playbackIdRef.current !== currentId) return;
        const ctx = player.getAudioContext();
        if (ctx) {
          playStartTime.current = ctx.currentTime;
          animationRef.current = requestAnimationFrame(updateProgress);
        }
      }, 10);
    }
  };

  const onClickDownload = () => {
    const fileName = `${title}.wav`.toLowerCase().replaceAll(' ', '-');
    downloadWavFile(audio, getSampleRate(), 1, fileName);
  };

  return (
    <Card>
      <Text>
        {title}
      </Text>
      <div className={styles.audio}>
        <div className={styles.buttons}>
          <Button
            small
            onClick={onClickPlay}
            Icon={isPlaying ? FaStop : FaPlay}
            className={styles.button}
            ariaLabel={isPlaying ? "Stop audio" : "Play audio"}
          />
          <Button
            small
            secondary
            ariaLabel="Download audio"
            onClick={onClickDownload}
            Icon={FaDownload}
            className={styles.button}
          />
        </div>
        <Chart 
          freqs={getFreqs()} 
          confidences={getConfidences()}
          color={color}
          progress={progress}
        />
      </div>
    </Card>
  );
};
