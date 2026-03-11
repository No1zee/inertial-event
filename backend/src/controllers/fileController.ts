import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const statAsync = promisify(fs.stat);
const readdirAsync = promisify(fs.readdir);

export const streamFile = async (req: Request, res: Response) => {
    try {
        const filePath = req.query.path as string;
        if (!filePath) {
            return res.status(400).json({ error: 'File path required' });
        }

        // Security Check: Ideally restrict to specific meaningful directories
        // But requested feature is "tunnel to source file", implying broad access
        // We will decode URI component just in case
        const decodedPath = decodeURIComponent(filePath);

        const stats = await statAsync(decodedPath);
        if (!stats.isFile()) {
            return res.status(400).json({ error: 'Path is not a file' });
        }

        const fileSize = stats.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;
            const file = fs.createReadStream(decodedPath, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4', // Naive MIME, should detect
            };
            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(200, head);
            fs.createReadStream(decodedPath).pipe(res);
        }
    } catch (error) {
        console.error('File Stream Error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};

export const listFiles = async (req: Request, res: Response) => {
    try {
        const dirPath = (req.query.path as string) || '/'; // Default to root if not spec
        const decodedPath = decodeURIComponent(dirPath);

        const items = await readdirAsync(decodedPath, { withFileTypes: true });

        const files = items.map(item => ({
            name: item.name,
            isDirectory: item.isDirectory(),
            path: path.join(decodedPath, item.name),
            size: item.isDirectory() ? 0 : 0 // Stat calls would be expensive for all
        }));

        res.json({ path: decodedPath, files });
    } catch (error) {
        console.error('List Files Error:', error);
        res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
    }
};
