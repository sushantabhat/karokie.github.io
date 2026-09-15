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
  useEffect(() => {
    if (!audio && isPlaying) {
      player.stop();
      setIsPlaying(false);
      setProgress(0);
    }
  }, [audio]);
  const [progress, setProgress] = useState(0);
  const playStartTime = useRef(0);
  const animationRef = useRef();

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
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
      setProgress(0);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    } else {
      setIsPlaying(true);
      setProgress(0);
      player.play(audio, getSampleRate(), () => {
        setIsPlaying(false);
        setProgress(0);
        if (animationRef.current) cancelAnimationFrame(animationRef.current);
      });
      // Start tracking time slightly after play to get accurate start
      setTimeout(() => {
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
          />
          <Button
            small
            secondary
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
