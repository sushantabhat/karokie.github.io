// @ts-nocheck
import { getScaleFreqs } from "../music/musicScales";
import * as crepe from '../pitchDetection/crepe';
import { DEFAULT_CREPE_OSAMP } from "../pitchDetection/crepeConstants";
import * as tuner from '../pitchShifting/tuner';
import { DEFAULT_TUNER_OSAMP, DEFAULT_TUNER_WINDOW_SIZE } from "../pitchShifting/tunerConstants";
import * as player from '../player/player';
import * as recorder from '../recorder/recorder';
import { DEFAULT_BASE_NOTE, DEFAULT_SCALE_NAME } from "./autotoneConstants";

export class Autotoner {

  _scaleFreqs;
  _tunerWindowSize;
  _tunerOsamp;
  _crepeOsamp;

  _recordingData;
  _autotonedAudio;
  _originalFreqs;
  _autotonedFreqs;

  constructor() {
    this._scaleFreqs = getScaleFreqs(DEFAULT_BASE_NOTE, DEFAULT_SCALE_NAME);
    this._tunerWindowSize = DEFAULT_TUNER_WINDOW_SIZE;
    this._tunerOsamp = DEFAULT_TUNER_OSAMP;
    this._crepeOsamp = DEFAULT_CREPE_OSAMP;
    this._queue = Promise.resolve();
    this._version = 0;
  }

  async init() {
    const { sampleRate } = await recorder.init();
    const crepeBufferSize = await crepe.getBufferSize(sampleRate);
    await recorder.initBufferProcessor(crepeBufferSize, this._crepeOsamp);
    await player.init();
    await crepe.init(sampleRate);
    await tuner.init();
  }

  record() {
    this._originalFreqs = null;
    this._autotonedFreqs = null;
    this._version++;
    this._autotonedAudio = null;
    this._confidences = null;
    recorder.record();
  }

  async stopRecording() {
    await recorder.stop();
    this._recordingData = recorder.getData();
    await this.autotone();
  }

  getSampleRate() {
    return this._recordingData?.sampleRate || null;
  }

  getOriginalAudio() {
    return this._recordingData?.audio || null;
  }

  getAutotonedAudio() {
    return this._autotonedAudio || null;
  }

  getOriginalFreqs() {
    return this._originalFreqs || null;
  }

  getAutotonedFreqs() {
    return this._autotonedFreqs || null;
  }

  getConfidences() {
    return this._confidences || null;
  }

  setScale(baseNote, scaleName) {
    this._scaleFreqs = getScaleFreqs(baseNote, scaleName);
    this._autotonedFreqs = null;
  }

  setTunerWindowSize(windowSize) {
    this._tunerWindowSize = Number(windowSize);
    this._originalFreqs = null;
    this._confidences = null;
    this._autotonedFreqs = null;
  }

  setTunerOsamp(osamp) {
    this._tunerOsamp = Number(osamp);
    this._originalFreqs = null;
    this._confidences = null;
    this._autotonedFreqs = null;
  }

  async autotone() {
    if (!this._recordingData) {
      return;
    }
    this._version++;
    const currentVersion = this._version;
    this._queue = this._queue.then(async () => {
      if (this._version !== currentVersion) return;
    if (!this._originalFreqs) {
      await this._pitchDetect(currentVersion);
    }
    if (!this._autotonedFreqs) {
        await this._pitchShift(currentVersion);
      }
    });
    await this._queue;
  }

  async _pitchDetect(currentVersion: number) {
    const { audio, buffers } = this._recordingData;
    const freqData = await crepe.detectPitches(buffers);
    if (this._version !== currentVersion) return;
    const freqs = new Float32Array(freqData.map((data) => data.freq));
    const confidences = new Float32Array(freqData.map((data) => data.confidence));
    const numWindows = await tuner.getNumWindows(
      audio.length, 
      this._tunerWindowSize, 
      this._tunerOsamp,
    );
    if (this._version !== currentVersion) return;
    const newConfidences = await tuner.resampleLinear(confidences, numWindows);
    const newFreqs = await tuner.resampleLinear(freqs, numWindows);
    if (this._version !== currentVersion) return;
    this._confidences = newConfidences;
    this._originalFreqs = newFreqs;
    this._autotonedFreqs = null;
  }

  async _pitchShift(currentVersion: number) {
    const { audio, sampleRate } = this._recordingData;
    const newAutotonedFreqs = await tuner.pitchSnap(this._originalFreqs, this._scaleFreqs);
    if (this._version !== currentVersion) return;
    const newAutotonedAudio = await tuner.pitchShift(
      audio,
      sampleRate,
      this._tunerWindowSize,
      this._tunerOsamp,
      this._originalFreqs,
      newAutotonedFreqs,
    );
    if (this._version !== currentVersion) return;
    this._autotonedFreqs = newAutotonedFreqs;
    this._autotonedAudio = newAutotonedAudio;
  }
}