import { Mic, Square, Upload } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '../shared/Button/Button';
import { Card } from '../shared/Card/Card';
import { Text } from '../shared/Text/Text';
import styles from './Record.module.css';

export const Record = ({ 
  isReady,
  isUploadReady,
  isRecording,
  isProcessing,
  isMicAccessible,
  error,
  record,
  stopRecording,
  handleUpload,
 }: any) => {

  const fileInputRef = useRef<HTMLInputElement>(null);
  const isDisabled = !isReady || isProcessing;
  const isUploadDisabled = !isUploadReady || isProcessing;

  let text;
  if (!isMicAccessible) {
    text = 'Microphone inaccessible. You can still upload.';
  } else if (error) {
    text = error;
  } else if (!isReady) {
    text = 'Loading CREPE model...';
  } else if (isProcessing) {
    text = 'Processing...';
  } else if (isRecording) {
    text = 'Recording...';
  } else {
    text = 'Ready to record or upload';
  }

  const onClick = () => {
    if (isDisabled) {
      return;
    }
    if (isRecording) {
      stopRecording();
    } else {
      record();
    }
  }

  const onUploadClick = () => {
    if (isUploadDisabled) return;
    fileInputRef.current?.click();
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && handleUpload) {
      handleUpload(file);
    }
    if (e.target) {
      e.target.value = '';
    }
  }

  return (
    <Card className={styles.card}>
      <Text center>
        {text}
      </Text>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px' }}>
        <Button
          className={styles.button}
          large 
          onClick={onClick}
          Icon={isRecording ? Square : Mic}
          disabled={isDisabled && !isRecording}
          ariaLabel={isRecording ? "Stop recording" : "Start recording"}
        />
        <Button
          className={styles.button}
          large
          onClick={onUploadClick}
          Icon={Upload}
          disabled={isUploadDisabled || isRecording}
          ariaLabel="Upload audio"
        />
        <input 
          type="file" 
          accept="audio/*" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={onFileChange} 
        />
      </div>
    </Card>
  );
};