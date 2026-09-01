import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    [key: string]: any;
  };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): void => {
  let token: string | undefined;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      
      // Har case ko handle karne ke liye (id, _id, ya userId)
      const userId = decoded.id || decoded._id || decoded.userId;

      if (!userId) {
        res.status(401).json({ message: 'Not authorized, invalid token payload' });
        return;
      }

      // Safely assign normalized user object
      req.user = {
        ...decoded,
        id: userId.toString(), // Standardized string ID
      };

      next();
      return;
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
      return;
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token provided' });
    return;
  }
};