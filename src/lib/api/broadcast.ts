import { LINEAR_CHANNELS, LinearChannel } from '../constants/channels';
import { contentApi } from './content';
import { Content } from '../types/content';

export interface BroadcastState {
  channel: LinearChannel;
  currentContent: Content;
  nextContent: Content;
  startTime: number; // ms timestamp
  duration: number; // ms
  elapsed: number; // ms
}

/**
 * Calculates what is currently playing on a channel.
 * Deterministic based on time.
 */
export async function getBroadcastState(channelId: string): Promise<BroadcastState | null> {
  const channel = LINEAR_CHANNELS.find(c => c.id === channelId);
  if (!channel) return null;

  // 1. Fetch content pool for the channel
  const pool = await contentApi.getTrending(1); 
  
  const contentPool = pool.slice(0, 10);
  if (contentPool.length === 0) return null;

  // 2. Deterministic selection based on current time
  const now = Date.now();
  const TWO_HOURS = 7200000;
  
  // Use a 2-hour rotation window
  const cycleIndex = Math.floor(now / TWO_HOURS);
  const contentIndex = cycleIndex % contentPool.length;
  const nextContentIndex = (contentIndex + 1) % contentPool.length;

  const currentContent = contentPool[contentIndex];
  const nextContent = contentPool[nextContentIndex];

  const cycleStartTime = cycleIndex * TWO_HOURS;
  const elapsed = now - cycleStartTime;

  return {
    channel,
    currentContent,
    nextContent,
    startTime: cycleStartTime,
    duration: TWO_HOURS,
    elapsed,
  };
}

export async function getAllBroadcasts(): Promise<BroadcastState[]> {
  const broadcasts: BroadcastState[] = [];
  for (const channel of LINEAR_CHANNELS) {
    const state = await getBroadcastState(channel.id);
    if (state) broadcasts.push(state);
  }
  return broadcasts;
}
