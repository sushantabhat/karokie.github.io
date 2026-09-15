// @ts-nocheck
import tinygradient from 'tinygradient';
import { useEffect, useRef, useState } from 'react';
import styles from './Chart.module.css';

const LINE_WIDTH = 5;
const MIN_CONFIDENCE_SQUARED = 0.5;

export const Chart = ({  freqs, confidences, color, progress = 0  }: any) => {
  
  const ref = useRef(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  const updateDims = () => {
    if (ref && ref.current) {
      const { clientWidth, clientHeight } = ref.current;
      if (dims.width !== clientWidth || dims.height !== clientHeight) {
        setDims({ width: clientWidth, height: clientHeight });
      }
      const context = ref.current.getContext('2d');
      if (!context) return;
      if (freqs && freqs.length > 0 && confidences && confidences.length > 0) {
        draw(freqs, confidences, color, context, progress);
      } else {
        context.clearRect(0, 0, clientWidth, clientHeight);
      }
    }
  };

  useEffect(() => {
    const handleResize = () => setDims({ width: 0, height: 0 });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    updateDims();
  }, [ref, freqs, confidences, dims, progress]);

  return (
    <canvas 
      className={styles.canvas} 
      ref={ref} 
      width={dims.width || undefined}
      height={dims.height || undefined}
    />
  );
};

// Helpers =============================================================

const draw = (freqs, confidences, color, context, progress: any = 0) => {
  const { width, height } = context.canvas;
  const normalizedConfidences = normalize(confidences);
  const coords = freqsToCoords(freqs, normalizedConfidences, width, height);
  const colors = confidencesToColors(normalizedConfidences, color);
  context.clearRect(0, 0, width, height);
  context.moveTo(0, height);
  context.beginPath();
  for (let i = 0; i < coords.length; i++) {
    context.lineTo(coords[i].x, coords[i].y);
    context.strokeStyle = colors[i];
    context.lineWidth = LINE_WIDTH;
    context.stroke();
    context.beginPath();
    context.moveTo(coords[i].x, coords[i].y);
  }
  
  if (progress > 0) {
    const startX = progress * width;
    context.beginPath();
    context.moveTo(startX, 0);
    context.lineTo(startX, height);
    context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    context.lineWidth = 2;
    context.stroke();
  }
};

const normalize = (values: any) => {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < values.length; i++) {
    min = Math.min(min, values[i]);
    max = Math.max(max, values[i]);
  }
  return Array.from(values).map((value) => {
    return max === min ? value : (value - min) / (max - min);
  });
};

const freqsToCoords = (freqs, confidences, width, height: any) => {
  let yMin = Infinity;
  let yMax = -Infinity;
  for (let i = 0; i < freqs.length; i++) {
    const confidenceSquared = confidences[i] * confidences[i];
    if (confidenceSquared > MIN_CONFIDENCE_SQUARED) {
      yMin = Math.min(yMin, freqs[i]);
      yMax = Math.max(yMax, freqs[i]);
    }
  }
  if (yMin === Infinity) {
    for (let i = 0; i < freqs.length; i++) {
      yMin = Math.min(yMin, freqs[i]);
      yMax = Math.max(yMax, freqs[i]);
    }
    if (yMin === Infinity) { yMin = 0; yMax = 0; }
  }
  if (yMax === yMin) { yMax = yMin + 1; }
  return Array.from(freqs).map((freq, index) => {
    const x = freqs.length <= 1 ? 0 : index / (freqs.length - 1) * width;
    let y = (1 - (freq - yMin) / (yMax - yMin)) * height;
    y = Math.max(y, 0);
    y = Math.min(y, height);
    return { x, y };
  });
};

const confidencesToColors = (confidences, color: any) => {
  const gradient = tinygradient(['#FFFFFF', color]).rgb(100);
  const hexGradient = gradient.map((color) => color.toHexString());
  return Array.from(confidences).map((value) => {
    const valueSquared = value * value;
    if (valueSquared < MIN_CONFIDENCE_SQUARED) {
      return hexGradient[0];
    }
    const colorIndex = Math.floor(valueSquared * (gradient.length - 1));
    return hexGradient[colorIndex];
  });
};
