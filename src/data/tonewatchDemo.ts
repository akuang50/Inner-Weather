import type { TonewatchDay } from '../types';
import { alignTonewatchDays } from '../engine/tonewatch';
import rawScores from './tonewatchScores.json';

/**
 * Demo Tonewatch output from `python tonewatch/run.py --demo`.
 * Days are realigned so the stressed tail sits near "yesterday".
 */
export const demoTonewatchDays: TonewatchDay[] = alignTonewatchDays(
  rawScores as TonewatchDay[],
  1,
);
