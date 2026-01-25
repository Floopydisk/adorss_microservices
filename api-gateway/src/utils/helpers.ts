import { Response } from "express";

export class ResponseHandler {
  static success<T>(
    res: Response,
    data: T,
    message: string = "Success",
    statusCode: number = 200,
  ) {
    res.status(statusCode).json({
      success: true,
      message,
      data,
    });
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 400,
    error?: any,
  ) {
    res.status(statusCode).json({
      success: false,
      message,
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }

  static unauthorized(res: Response, message: string = "Unauthorized") {
    res.status(401).json({
      success: false,
      message,
    });
  }

  static forbidden(res: Response, message: string = "Forbidden") {
    res.status(403).json({
      success: false,
      message,
    });
  }

  static notFound(res: Response, message: string = "Not found") {
    res.status(404).json({
      success: false,
      message,
    });
  }

  static serviceUnavailable(
    res: Response,
    message: string = "Service unavailable",
    error?: any,
  ) {
    res.status(503).json({
      success: false,
      message,
      error: process.env.NODE_ENV === "development" ? error : undefined,
    });
  }
}

export class Logger {
  static info(message: string, data?: any) {
    console.log(
      `[INFO] ${new Date().toISOString()} - ${message}`,
      data ? JSON.stringify(data) : "",
    );
  }

  static error(message: string, error?: any) {
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${message}`,
      error || "",
    );
  }

  static warn(message: string, data?: any) {
    console.warn(
      `[WARN] ${new Date().toISOString()} - ${message}`,
      data ? JSON.stringify(data) : "",
    );
  }

  static debug(message: string, data?: any) {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[DEBUG] ${new Date().toISOString()} - ${message}`,
        data ? JSON.stringify(data) : "",
      );
    }
  }
}
