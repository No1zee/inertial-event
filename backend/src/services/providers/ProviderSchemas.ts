import { z } from 'zod';

export const StreamSourceSchema = z.object({
    url: z.string().url(),
    quality: z.string().optional().default('auto'),
    type: z.enum(['hls', 'mp4', 'torrent', 'embed']).default('hls'),
    provider: z.string()
});

export const SubtitleSchema = z.object({
    url: z.string().url(),
    lang: z.string(),
    label: z.string().optional()
});

export const ProviderResponseSchema = z.object({
    sources: z.array(StreamSourceSchema),
    subtitles: z.array(SubtitleSchema).optional().default([])
});

export type IStreamSource = z.infer<typeof StreamSourceSchema>;
export type ISubtitle = z.infer<typeof SubtitleSchema>;
export type IProviderResponse = z.infer<typeof ProviderResponseSchema>;
