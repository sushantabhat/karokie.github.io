// These helpers abstract away the messaging interface of a web worker
// to instead expose a promisified API

interface WorkerMessageData {
  type: string;
  payload?: unknown;
  messageId?: number;
  error?: string;
}

interface WorkerMessageEvent extends MessageEvent {
  data: WorkerMessageData;
}

let messageIdCounter = 0;

export const createWebWorkerSender = (worker: Worker, key: string) => {
  const pending = new Map<number, { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }>();

  const clearPending = (err: Error | Event) => { 
    for (const {reject} of pending.values()) reject(err); 
    pending.clear(); 
  };
  worker.addEventListener('error', (err: ErrorEvent) => clearPending(err));
  worker.addEventListener('messageerror', (err: MessageEvent) => clearPending(err));
  worker.addEventListener('message', (message: MessageEvent<WorkerMessageData>) => {
    const { type, payload, messageId, error } = message.data;
    if (type === key && messageId !== undefined && pending.has(messageId)) {
      const { resolve, reject } = pending.get(messageId)!;
      pending.delete(messageId);
      if (error) reject(new Error(error));
      else resolve(payload);
    }
  });
  
  return (...args: unknown[]) => {
    return new Promise((resolve, reject) => {
      const messageId = ++messageIdCounter;
      pending.set(messageId, { resolve, reject });
      worker.postMessage({ type: key, payload: args, messageId });
    });
  };
};

export const createWebWorkerReceiver = (sendMessage: (msg: unknown) => void, fns: { key: string; fn: (...args: unknown[]) => Promise<unknown> | unknown }[]) => {
  return async (message: MessageEvent<WorkerMessageData>) => {
    const { type, payload, messageId } = message.data;
    for (const { key, fn } of fns) {
      if (key === type) {
        try {
          const result = await fn(...((payload as unknown[]) || []));
          sendMessage({ type: key, payload: result, messageId });
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Worker Error';
          sendMessage({ type: key, error: errorMessage, messageId });
        }
      }
    }
  };
};
