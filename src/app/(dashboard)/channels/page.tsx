import { getAllBroadcasts } from '@/lib/api/broadcast';
import ChannelsClient from './ChannelsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Channels | MaiWatch',
  description: 'Experience 24/7 curated cinematic broadcasts. No decisions, just high-fidelity entertainment.',
};

export default async function ChannelsPage() {
  const broadcasts = await getAllBroadcasts();
  
  if (broadcasts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] text-center gap-4">
        <h1 className="text-2xl font-bold text-white">Broadcast Offline</h1>
        <p className="text-zinc-500">The galactic transmitter is currently undergoing maintenance.</p>
      </div>
    );
  }

  return <ChannelsClient initialBroadcasts={broadcasts} />;
}
