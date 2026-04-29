import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const type = searchParams.get('type');
  const season = searchParams.get('season') || '1';
  const episode = searchParams.get('episode') || '1';
  const title = searchParams.get('title') || '';
  const audioPreference = searchParams.get('audioPreference') || 'dub';

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || '';
  
  if (!backendUrl) {
    console.warn('[SourcesProxy] NEXT_PUBLIC_API_URL is not set. Returning empty sources.');
    return NextResponse.json({ sources: [], subtitles: [] });
  }

  const targetUrl = `${backendUrl}/api/sources?id=${id}&type=${type}&season=${season}&episode=${episode}&title=${encodeURIComponent(title)}&audioPreference=${audioPreference}`;

  console.log(`[SourcesProxy] Fetching from: ${targetUrl}`);

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch sources from backend' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[SourcesProxy] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
