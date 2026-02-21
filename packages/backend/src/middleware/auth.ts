import { Request, Response, NextFunction } from "express";

/**
 * Optional API key authentication middleware.
 * Set API_KEY env var to enable. If not set, all requests are allowed.
 */
export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = process.env.API_KEY;

  // If no API key configured, allow all requests
  if (!apiKey) {
    return next();
  }

  const provided = req.headers["x-api-key"] || req.query.api_key;

  if (provided !== apiKey) {
    res.status(401).json({ error: "Invalid or missing API key", code: "UNAUTHORIZED" });
    return;
  }

  next();
}
