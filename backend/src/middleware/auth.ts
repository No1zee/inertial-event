import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

interface AuthRequest extends Request {
    user?: { userId: string; email: string };
}

export const verifyToken = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || 'your-secret-key'
        ) as { userId: string; email: string };

        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

export const optionalAuth = (
    req: AuthRequest,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(
                token,
                process.env.JWT_SECRET || 'your-secret-key'
            ) as { userId: string; email: string };
            req.user = decoded;
        }

        next();
    } catch (error) {
        next();
    }
};

export default verifyToken;
