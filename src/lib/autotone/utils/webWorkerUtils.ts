// @ts-nocheck
// These helpers abstract away the messaging interface of a web worker
// to instead expose a promisified API

// Should be called outside the wb worker
let messageIdCounter = 0;

export const createWebWorkerSender = (worker, key) => {
  const pending = new Map();

  worker.addEventListener('message', (message) => {
    const { type, payload, messageId, error } = message.data;
    if (type === key && pending.has(messageId)) {
      const { resolve, reject } = pending.get(messageId);
      pending.delete(messageId);
      if (error) reject(new Error(error));
      else resolve(payload);
    }
  });
  
  return (...args) => {
    return new Promise((resolve, reject) => {
      const messageId = ++messageIdCounter;
      pending.set(messageId, { resolve, reject });
      worker.postMessage({ type: key, payload: args, messageId });
    });
  };
};

// Should be called in the web worker
export const createWebWorkerReceiver = (sendMessage, fns) => {
  return async (message) => {
    const { type, payload, messageId } = message.data;
    for (const { key, fn } of fns) {
      if (key === type) {
        try {
          const result = await fn(...payload);
          sendMessage({ type: key, payload: result, messageId });
        } catch (err) {
          sendMessage({ type: key, error: err.message || 'Worker Error', messageId });
        }
      }
    }
  };
};

