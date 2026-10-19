import jwt from 'jsonwebtoken';
import redis from '../config/redis.js';
import prisma from '../config/prisma.js';

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check Redis session (graceful if Redis is offline)
    try {
      const sessionToken = await redis.get(`session:${decoded.userId}`);
      if (sessionToken && sessionToken !== token) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
      }
    } catch {
      // Redis unavailable — fall through to DB-only auth
    }

    // Attempt to get user efficiently. If Redis cached user data, we could use that.
    // For now, we query the DB to ensure fresh data (e.g. if they updated income)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User no longer exists' });
    }

    // Attach user to request
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Unauthorized: Token expired' });
    }
    console.error('Auth Middleware Error:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};
