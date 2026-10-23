import { createServer } from "../server/index";

const app = createServer();

export default function handler(req: any, res: any) {
  // Normalize URL before Express handles routing:
  // On Vercel, requests to /api/products might arrive with or without the /api prefix
  if (req.url && !req.url.startsWith("/api") && req.url !== "/health") {
    req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
  return app(req, res);
}
