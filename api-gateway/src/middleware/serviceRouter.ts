import { createProxyMiddleware } from "http-proxy-middleware";
import { Request, Response } from "express";

interface ProxyConfig {
  target: string;
  changeOrigin: boolean;
  pathRewrite?: Record<string, string>;
  onProxyReq?: (proxyReq: any, req: Request, res: Response) => void;
  onProxyRes?: (proxyRes: any, req: Request, res: Response) => void;
  onError?: (err: Error, req: Request, res: Response) => void;
}

class ServiceRouter {
  static createProxy(target: string, pathRewrite?: Record<string, string>) {
    const config: ProxyConfig = {
      target,
      changeOrigin: true,
      pathRewrite: pathRewrite || {},
      onProxyReq: (proxyReq: any, req: Request, res: Response) => {
        // Forward user context from gateway to service
        if (req.user) {
          proxyReq.setHeader("X-User-ID", req.user.sub);
          proxyReq.setHeader("X-User-Role", req.user.role);
          proxyReq.setHeader("X-School-ID", req.user.school_id);
          proxyReq.setHeader("X-User-Email", req.user.email);
        }
        // Forward original token
        if (req.token) {
          proxyReq.setHeader("Authorization", `Bearer ${req.token}`);
        }
      },
      onProxyRes: (proxyRes: any, req: Request, res: Response) => {
        // Add gateway identifier header
        proxyRes.headers["X-Forwarded-By"] = "api-gateway";
      },
      onError: (err: Error, req: Request, res: Response) => {
        console.error(`Proxy error for ${req.path}:`, err);
        res.status(503).json({
          success: false,
          message: "Service unavailable",
          error: err.message,
        });
      },
    };

    return createProxyMiddleware(config);
  }
}

export default ServiceRouter;
