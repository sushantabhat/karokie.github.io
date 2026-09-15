// @ts-nocheck
export class BufferNode extends AudioWorkletNode {

  _buffers;
  _bufferSize;
  _osamp;

  constructor(context, bufferSize, osamp) {
    super(context, 'buffer-processor', { parameterData: { bufferSize, osamp }});
    this._bufferSize = bufferSize;
    this._osamp = osamp;
    this.port.onmessage = this.onMessage.bind(this);
    this.reset();
  }

  reset() {
    this._buffers = [];
    this._finalizeResolve = null;
    this._finalCount = 0;
    this.port.postMessage({ type: 'reset' });
  }

  onMessage(message) {
    if (message.data && message.data.type === 'finalizeAck') {
      this._finalCount = message.data.count;
      if (message.data.count > 0 && message.data.buffer) {
        this._buffers.push(message.data.buffer);
      }
      if (this._finalizeResolve) {
        this._finalizeResolve();
        this._finalizeResolve = null;
      }
    } else {
      this._buffers.push(message.data);
    }
  }

  async finalize() {
    return new Promise((resolve) => {
      this._finalizeResolve = resolve;
      this.port.postMessage({ type: 'finalize' });
    });
  }

  getAudioData() {
    if (this._buffers.length === 0) {
      return null;
    }
    const hopSize = this._bufferSize / this._osamp;
    let audioSize = 0;
    if (this._buffers.length === 1) {
      audioSize = this._finalCount > 0 ? this._finalCount : this._bufferSize;
    } else {
      const baseSize = this._bufferSize + ((this._buffers.length - 2) * hopSize);
      const overlap = this._bufferSize - hopSize;
      const finalValid = this._finalCount > 0 ? Math.max(0, this._finalCount - overlap) : hopSize;
      audioSize = baseSize + finalValid;
    }
    const audio = new Float32Array(audioSize);
    audio.set(this._buffers[0].subarray(0, Math.min(this._buffers[0].length, audioSize)));
    for (let i = 1; i < this._buffers.length; i++) {
      const offset = this._bufferSize + (i - 1) * hopSize;
      const remaining = audioSize - offset;
      if (remaining <= 0) break;
      for (let j = 0; j < Math.min(hopSize, remaining); j++) {
        audio[offset + j] = this._buffers[i][this._bufferSize - hopSize + j];
      }
    }
    return {
      audio,
      buffers: this._buffers,
      bufferSize: this._bufferSize,
      osamp: this._osamp,
    };
  }
}
