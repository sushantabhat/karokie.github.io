import { createWebWorkerSender } from '@/lib/autotone/utils/webWorkerUtils';
import * as constants from './crepeConstants.js';

const worker = new Worker(new URL('./crepe.worker.js', import.meta.url));

export const getBufferSize = createWebWorkerSender(worker, constants.CREPE_GET_BUFFER_SIZE);
export const init = createWebWorkerSender(worker, constants.CREPE_INIT);
export const detectPitches = createWebWorkerSender(worker, constants.CREPE_DETECT_PITCHES);
