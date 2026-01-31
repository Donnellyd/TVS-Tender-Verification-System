import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface AuditLogEntry {
  timestamp: Date;
  userId?: string;
  tenantId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  ipAddress: string;
  userAgent?: string;
  method: string;
  path: string;
  statusCode?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

export function createRateLimiter(config: RateLimitConfig) {
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = getClientIdentifier(req);
    const now = Date.now();
    const entry = rateLimitStore.get(identifier);

    if (!entry || entry.resetAt < now) {
      rateLimitStore.set(identifier, { count: 1, resetAt: now + config.windowMs });
      setRateLimitHeaders(res, config.maxRequests, config.maxRequests - 1, now + config.windowMs);
      return next();
    }

    if (entry.count >= config.maxRequests) {
      setRateLimitHeaders(res, config.maxRequests, 0, entry.resetAt);
      return res.status(429).json({
        error: "rate_limit_exceeded",
        message: "Too many requests, please try again later",
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      });
    }

    entry.count++;
    setRateLimitHeaders(res, config.maxRequests, config.maxRequests - entry.count, entry.resetAt);
    next();
  };
}

function getClientIdentifier(req: Request): string {
  const apiKey = (req as any).apiKeyInfo?.keyId;
  if (apiKey) return `api:${apiKey}`;
  
  const userId = (req as any).user?.id;
  if (userId) return `user:${userId}`;
  
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  return `ip:${ip}`;
}

function setRateLimitHeaders(res: Response, limit: number, remaining: number, resetAt: number) {
  res.set("X-RateLimit-Limit", limit.toString());
  res.set("X-RateLimit-Remaining", Math.max(0, remaining).toString());
  res.set("X-RateLimit-Reset", Math.ceil(resetAt / 1000).toString());
}

const auditLogQueue: AuditLogEntry[] = [];
const AUDIT_LOG_FLUSH_INTERVAL = 5000;
const AUDIT_LOG_BATCH_SIZE = 100;

export function auditLogger(action: string, options: { sensitiveFields?: string[] } = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    
    res.on("finish", () => {
      const entry: AuditLogEntry = {
        timestamp: new Date(),
        userId: (req as any).user?.id,
        tenantId: (req as any).apiKeyInfo?.tenantId || (req as any).user?.tenantId,
        action,
        resource: req.baseUrl + req.path,
        resourceId: req.params.id,
        ipAddress: req.ip || req.socket.remoteAddress || "unknown",
        userAgent: req.get("user-agent") || undefined,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration: Date.now() - startTime,
        metadata: sanitizeRequestData(req.body, options.sensitiveFields),
      };
      
      auditLogQueue.push(entry);
      
      if (auditLogQueue.length >= AUDIT_LOG_BATCH_SIZE) {
        flushAuditLogs();
      }
    });
    
    next();
  };
}

function sanitizeRequestData(data: any, sensitiveFields: string[] = []): any {
  if (!data || typeof data !== "object") return data;
  
  const defaultSensitive = ["password", "secret", "apiKey", "token", "creditCard", "ssn"];
  const allSensitive = [...defaultSensitive, ...sensitiveFields];
  
  const sanitized = { ...data };
  for (const field of allSensitive) {
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  }
  
  return sanitized;
}

async function flushAuditLogs() {
  if (auditLogQueue.length === 0) return;
  
  const logs = auditLogQueue.splice(0, AUDIT_LOG_BATCH_SIZE);
  console.log(`Audit logs flushed: ${logs.length} entries`);
}

setInterval(flushAuditLogs, AUDIT_LOG_FLUSH_INTERVAL);

export interface Permission {
  resource: string;
  action: "create" | "read" | "update" | "delete" | "manage";
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    { resource: "*", action: "manage" },
  ],
  owner: [
    { resource: "tenants", action: "manage" },
    { resource: "users", action: "manage" },
    { resource: "billing", action: "manage" },
    { resource: "api_keys", action: "manage" },
    { resource: "compliance", action: "manage" },
    { resource: "bids", action: "manage" },
    { resource: "documents", action: "manage" },
  ],
  manager: [
    { resource: "users", action: "read" },
    { resource: "users", action: "update" },
    { resource: "compliance", action: "manage" },
    { resource: "bids", action: "manage" },
    { resource: "documents", action: "manage" },
  ],
  analyst: [
    { resource: "bids", action: "read" },
    { resource: "documents", action: "read" },
    { resource: "compliance", action: "read" },
    { resource: "analytics", action: "read" },
  ],
  viewer: [
    { resource: "bids", action: "read" },
    { resource: "documents", action: "read" },
  ],
};

export function hasPermission(userRole: string, resource: string, action: Permission["action"]): boolean {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  
  return permissions.some(p => 
    (p.resource === "*" || p.resource === resource) &&
    (p.action === "manage" || p.action === action)
  );
}

export function requirePermission(resource: string, action: Permission["action"]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    const apiKeyInfo = (req as any).apiKeyInfo;
    
    let role = "viewer";
    if (user) {
      role = user.role || "viewer";
    } else if (apiKeyInfo?.permissions) {
      if (apiKeyInfo.permissions.includes("admin")) role = "admin";
      else if (apiKeyInfo.permissions.includes("write")) role = "manager";
      else role = "viewer";
    }
    
    if (!hasPermission(role, resource, action)) {
      return res.status(403).json({
        error: "forbidden",
        message: `Insufficient permissions for ${action} on ${resource}`,
      });
    }
    
    next();
  };
}

export function encryptField(value: string, key: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  
  let encrypted = cipher.update(value, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

export function decryptField(encryptedValue: string, key: string): string {
  const [ivHex, authTagHex, encrypted] = encryptedValue.split(":");
  
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  
  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString("hex");
}

export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

export function sanitizeOutput(data: any, allowedFields?: string[]): any {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeOutput(item, allowedFields));
  }
  
  if (typeof data === "object") {
    const sensitiveFields = ["password", "passwordHash", "apiKey", "keyHash", "secret", "token"];
    const result: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (sensitiveFields.includes(key)) continue;
      if (allowedFields && !allowedFields.includes(key)) continue;
      
      result[key] = sanitizeOutput(value, undefined);
    }
    
    return result;
  }
  
  return data;
}

export function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("X-XSS-Protection", "1; mode=block");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  
  if (process.env.NODE_ENV === "production") {
    res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  
  next();
}
