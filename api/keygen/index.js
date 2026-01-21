// Vercel Serverless Function Handler for Keygen API
// Wraps Express app for compatibility with Vercel's Node.js runtime

import { app } from '../../keygen-server/src/app.js';

// Vercel expects a default export function that handles (req, res)
export default function handler(req, res) {
    // Let Express handle the request
    return app(req, res);
}

// Configure Vercel runtime
export const config = {
    api: {
        bodyParser: true,
        externalResolver: true,
    },
};
