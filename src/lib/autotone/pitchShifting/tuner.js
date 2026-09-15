import { createWebWorkerSender } from '@/lib/autotone/utils/webWorkerUtils';
import * as constants from './tunerConstants.js';

const worker = new Worker(new URL('./tuner.worker.js', import.meta.url));

export const init = createWebWorkerSender(worker, constants.TUNER_INIT);
export const getNumWindows = createWebWorkerSender(worker, constants.TUNER_GET_NUM_WINDOWS);
export const resampleLinear = createWebWorkerSender(worker, constants.TUNER_RESAMPLE_LINEAR);
export const pitchSnap = createWebWorkerSender(worker, constants.TUNER_PITCH_SNAP);
export const pitchShift = createWebWorkerSender(worker, constants.TUNER_PITCH_SHIFT);
