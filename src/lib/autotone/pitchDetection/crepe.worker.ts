// @ts-nocheck
import { createWebWorkerReceiver } from '@/lib/autotone/utils/webWorkerUtils';
import * as crepe from './crepeApi';
import * as constants from './crepeConstants';

/* eslint-disable no-restricted-globals */
self.onmessage = createWebWorkerReceiver(self.postMessage, [
  {
    key: constants.CREPE_GET_BUFFER_SIZE,
    fn: crepe.getBufferSize,
  },
  {
    key: constants.CREPE_INIT,
    fn: crepe.init,
  },
  {
    key: constants.CREPE_DETECT_PITCHES,
    fn: crepe.detectPitches,
  }
]);
/* eslint-enable no-restricted-globals */
