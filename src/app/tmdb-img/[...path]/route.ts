import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
    const path = request.nextUrl.pathname.replace("/tmdb-img", "");
    const searchParams = request.nextUrl.search;

    // TMDB image URL structure: https://image.tmdb.org/t/p/{size}/{path}
    // Our request comes as /tmdb-img/{size}/{path}
    // So 'path' from replace will be /{size}/{path}
    const imageUrl = `https://image.tmdb.org/t/p${path}${searchParams}`;

    console.log(`[TMDB-IMG] URL: ${imageUrl}`);

    try {
        const response = await fetch(imageUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
                'Referer': 'https://www.themoviedb.org/',
            }
        });

        if (!response.ok) {
            console.error(`[TMDB-IMG] TMDB responded with ${response.status} for ${imageUrl}`);
            return new NextResponse(null, { status: response.status });
        }

        const buffer = await response.arrayBuffer();
        return new NextResponse(Buffer.from(buffer), {
            headers: {
                'Content-Type': response.headers.get('content-type') || 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error: any) {
        console.error(`[TMDB-IMG] Critical Error: ${error.message}`);
        return new NextResponse(null, { status: 500 });
    }
}
