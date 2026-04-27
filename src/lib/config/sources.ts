export type StreamingSource = {
  id: string;
  codename: string;
  technicalName: string;
  baseUrl: string;
  stability: 'stable' | 'experimental' | 'backup';
  type: 'iframe' | 'native';
  description: string;
};

export const SOURCES: StreamingSource[] = [
  {
    id: 'vidlink',
    codename: 'VidLink Prime',
    technicalName: 'VidLink Pro',
    baseUrl: 'https://vidlink.pro',
    stability: 'stable',
    type: 'iframe',
    description: 'Primary high-performance node with optimized playback and progress sync.',
  },
  {
    id: 'embed-su',
    codename: 'Aegis Core',
    technicalName: 'Embed.su',
    baseUrl: 'https://embed.su',
    stability: 'stable',
    type: 'iframe',
    description: 'Clean proxy with highly reliable load balancing and minimal penalty triggers.',
  },
  {
    id: 'autoembed',
    codename: 'Aegis Sentinel',
    technicalName: 'AutoEmbed.cc',
    baseUrl: 'https://player.autoembed.cc',
    stability: 'stable',
    type: 'iframe',
    description: 'Secondary proxy for robust, low-latency streaming fallback.',
  },
  {
    id: 'vidsrc-to',
    codename: 'Foundation Prime',
    technicalName: 'VidSrc TO',
    baseUrl: 'https://vidsrc.to',
    stability: 'backup',
    type: 'iframe',
    description: 'Highly stable broadcast nodes with global redundancy.',
  },
  {
    id: 'vidsrc-me',
    codename: 'Sanctum Index',
    technicalName: 'VidSrc ME',
    baseUrl: 'https://vidsrc.me',
    stability: 'backup',
    type: 'iframe',
    description: 'Reliable secondary indexing for archival content.',
  },
  {
    id: 'multiembed',
    codename: 'Nexus Proxy',
    technicalName: 'MultiEmbed',
    baseUrl: 'https://multiembed.mov',
    stability: 'experimental',
    type: 'iframe',
    description: 'Aggregated source cluster for maximum availability.',
  },
];
