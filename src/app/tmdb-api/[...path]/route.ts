import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_READ_ACCESS_TOKEN = process.env.TMDB_READ_ACCESS_TOKEN;

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
    // 1. Check for API Key
    if (!TMDB_READ_ACCESS_TOKEN) {
        return NextResponse.json({ error: "TMDB Config Missing" }, { status: 500 });
    }

    // 2. Parse the path (e.g., /tmdb-api/trending/all/day)
    // The file should be at src/app/tmdb-api/[...path]/route.ts
    const path = request.nextUrl.pathname.replace("/tmdb-api", "");
    const searchParams = request.nextUrl.search; // Pass through query params like ?page=1

    try {
        console.log(`[TMDB Proxy] Fetching: ${path}${searchParams}`);

        const response = await axios.get(`${TMDB_API_URL}${path}${searchParams}`, {
            headers: {
                Authorization: `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
                accept: "application/json"
            }
        });

        return NextResponse.json(response.data);
    } catch (error: any) {
        console.error("[TMDB Proxy] Error:", error.message);
        return NextResponse.json(
            { error: error.message },
            { status: error.response?.status || 500 }
        );
    }
}
