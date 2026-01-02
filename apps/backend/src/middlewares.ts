import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod/v4";

import type ErrorResponse from "./interfaces/error-response.js";

import { env } from "./env.js";

export function notFound(req: Request, res: Response, next: NextFunction) {
  res.status(404);
  const error = new Error(`🔍 - Not Found - ${req.originalUrl}`);
  next(error);
}

export function errorHandler(err: Error, req: Request, res: Response<ErrorResponse>, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400);
    res.json({
      message: "Invalid request payload",
      stack: env.NODE_ENV === "production" ? "🥞" : err.issues.map(issue => `${issue.path.join(".")}: ${issue.message}`).join(", "),
    });
    return;
  }

  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode);
  res.json({
    message: err.message,
    stack: env.NODE_ENV === "production" ? "🥞" : err.stack,
  });
}
