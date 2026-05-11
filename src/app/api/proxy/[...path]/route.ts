import { NextRequest, NextResponse } from 'next/server';

export async function generateStaticParams() {
  return [];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const searchParams = request.nextUrl.searchParams;
  const { path: pathSegments } = await params;
  const path = pathSegments.join('/');
  
  // Construct the target URL (local bridge)
  const targetUrl = new URL(`http://localhost:5000/${path}`);
  
  // Forward all query parameters
  searchParams.forEach((value, key) => {
    targetUrl.searchParams.append(key, value);
  });

  try {
    const response = await fetch(targetUrl.toString(), {
      method: 'GET',
      headers: {
        // Forward relevant headers like Range for video streaming
        'Range': request.headers.get('Range') || '',
      },
    });

    // If it's a 404 or other error from bridge
    if (!response.ok && response.status !== 206) {
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          'Content-Type': 'application/json',
        }
      });
    }

    // Proxy the response headers
    const headers = new Headers();
    const headersToForward = [
      'Content-Type',
      'Content-Length',
      'Content-Range',
      'Accept-Ranges',
      'Cache-Control'
    ];

    headersToForward.forEach(h => {
      const val = response.headers.get(h);
      if (val) headers.set(h, val);
    });

    // Handle Streaming
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });

  } catch (error) {
    console.error('Proxy Error:', error);
    return NextResponse.json(
      { error: 'Local Bridge Unreachable. Ensure the NovaStream bridge is running locally.' },
      { status: 502 }
    );
  }
}
