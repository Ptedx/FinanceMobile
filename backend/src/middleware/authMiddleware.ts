import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
    };
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const apiKey = req.headers['x-api-key'] as string;

    if (apiKey) {
        try {
            const user = await prisma.user.findUnique({ where: { apiKey } });
            if (user) {
                req.user = { userId: user.id };
                return next();
            } else {
                return res.status(401).json({ error: 'Invalid API Key' });
            }
        } catch (error) {
            console.error('API Key Auth Error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
        return res.status(401).json({ error: 'Token error' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
        return res.status(401).json({ error: 'Token malformatted' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
        req.user = { userId: decoded.userId };
        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Token invalid' });
    }
};
