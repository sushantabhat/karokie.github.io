// @ts-nocheck
let audioContext;
let currentSource = null;

export const init = async () => {
  audioContext = new AudioContext();
  audioContext.suspend();
};

export const play = async (data, sampleRate, onEnded) => {
  // Stop existing playback if any
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {}
    currentSource = null;
  }

  const buffer = audioContext.createBuffer(1, data.length, sampleRate);
  const channel = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    channel[i] = data[i];
  }
  
  const audioSource = audioContext.createBufferSource();
  audioSource.connect(audioContext.destination);
  audioSource.buffer = buffer;
  
  if (onEnded) {
    audioSource.onended = () => {
      if (currentSource === audioSource) {
        currentSource = null;
      }
      if (currentSource === audioSource) onEnded();
    };
  }

  currentSource = audioSource;
  
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
  
  audioSource.start();
};

export const stop = () => {
  if (currentSource) {
    try {
      currentSource.stop();
    } catch (e) {}
    currentSource = null;
  }
};

export const getAudioContext = () => audioContext;
