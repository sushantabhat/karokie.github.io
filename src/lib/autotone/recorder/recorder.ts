// @ts-nocheck
import { BufferNode } from './BufferNode';

const DESIRED_SAMPLE_RATE = 48000;

let audioContext;
let microphone;
let bufferNode;
let mediaStream;

export const init = async () => {
  audioContext = new AudioContext({ sampleRate: DESIRED_SAMPLE_RATE });
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaStream.getAudioTracks().forEach((track: MediaStreamTrack) => track.enabled = false);
  const stream = mediaStream;
  microphone = audioContext.createMediaStreamSource(stream);
  audioContext.suspend();
  console.log('Recorder sample rate:', audioContext.sampleRate);
  return {
    sampleRate: audioContext.sampleRate,
  };
};

export const initBufferProcessor = async (bufferSize, osamp) => {
  await audioContext.audioWorklet.addModule('/BufferProcessor.js');
  bufferNode = new BufferNode(audioContext, bufferSize, osamp);
  microphone.connect(bufferNode);
};

export const record = async () => {
  mediaStream.getAudioTracks().forEach((track: MediaStreamTrack) => track.enabled = true);
  bufferNode.reset();
  audioContext.resume();
};

export const stop = async () => {
  mediaStream.getAudioTracks().forEach((track: MediaStreamTrack) => track.enabled = false);
  audioContext.suspend();
  if (bufferNode) await bufferNode.finalize();
};

export const getData = () => {
  const audioData = bufferNode.getAudioData();
  if (!audioData) return null;
  return {
    sampleRate: audioContext.sampleRate,
    ...audioData,
  };
};