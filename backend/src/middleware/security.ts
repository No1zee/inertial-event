import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

// Rate limiting configuration
export const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: JSON.stringify({
      error: message,
      retryAfter: Math.ceil(windowMs / 1000)
    }),
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Different rate limits for different endpoints
export const authRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts, please try again later.'
);

export const generalRateLimit = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many requests from this IP, please try again later.'
);

export const apiRateLimit = createRateLimiter(
  1 * 60 * 1000, // 1 minute
  30, // 30 requests
  'API rate limit exceeded, please try again later.'
);

// Enhanced Helmet configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      connectSrc: ["'self'", "https:", "ws:", "wss:"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'", "blob:", "https:"],
      frameSrc: ["'none'"],
      childSrc: ["'none'"],
      workerSrc: ["'self'", "blob:"],
      manifestSrc: ["'self'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false, // Needed for some streaming functionality
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true
});

// Input validation middleware
export const validateInput = (req: Request, res: Response, next: NextFunction) => {
  // Check for common injection patterns
  const suspiciousPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // XSS
    /('|(\\')|(;)|(\%27)|(\%3B))/gi, // SQL injection
    /((\%3C)|<)((\%2F)|\/)*[a-z0-9\%]+((\%3E)|>)/gi, // HTML injection
    /eval\s*\(/gi, // Code injection
    /javascript:/gi, // JavaScript protocol
    /vbscript:/gi, // VBScript protocol
    /onload\s*=/gi, // Event handler injection
    /onerror\s*=/gi, // Error handler injection
  ];

  const checkValue = (value: any): boolean => {
    if (typeof value === 'string') {
      return suspiciousPatterns.some(pattern => pattern.test(value));
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).some(checkValue);
    }
    return false;
  };

  // Check query parameters
  if (checkValue(req.query)) {
    return res.status(400).json({ error: 'Invalid input detected' });
  }

  // Check request body
  if (checkValue(req.body)) {
    return res.status(400).json({ error: 'Invalid input detected' });
  }

  next();
};

// CORS configuration
export const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'https://vercel.app',
      'https://netlify.app'
    ];

    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000', 'http://localhost:3001');
    }

    if (allowedOrigins.some(allowed => origin?.includes(allowed))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// IP blocking middleware
const blockedIPs = new Set<string>();

export const blockIP = (ip: string, duration: number = 24 * 60 * 60 * 1000) => {
  blockedIPs.add(ip);
  setTimeout(() => blockedIPs.delete(ip), duration);
};

export const ipBlockingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const clientIP = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
  
  if (clientIP && blockedIPs.has(clientIP)) {
    return res.status(403).json({ error: 'IP address blocked' });
  }

  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  
  // Log request
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - IP: ${clientIP}`);
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = res.statusCode >= 400 ? 'ERROR' : 'INFO';
    
    console.log(`${new Date().toISOString()} - ${logLevel} - ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms - IP: ${clientIP}`);
    
    // Block IPs with too many failed requests
    if (res.statusCode === 401 || res.statusCode === 403) {
      // Additional logic to track and block suspicious IPs
    }
  });

  next();
};

// File upload security middleware
export const fileUploadSecurity = (req: Request, res: Response, next: NextFunction) => {
  // Check file size limit (10MB max)
  const contentLength = parseInt(req.headers['content-length'] || '0');
  if (contentLength > 10 * 1024 * 1024) {
    return res.status(413).json({ error: 'File too large' });
  }

  // Check content type
  const contentType = req.headers['content-type'];
  if (contentType && !contentType.includes('multipart/form-data')) {
    return res.status(400).json({ error: 'Invalid content type for file upload' });
  }

  next();
};

// Session security middleware
export const sessionSecurity = (req: Request, res: Response, next: NextFunction) => {
  // Set secure headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add security nonce for CSP if needed
  const nonce = Buffer.from(Math.random().toString()).toString('base64');
  res.locals.nonce = nonce;
  
  next();
};