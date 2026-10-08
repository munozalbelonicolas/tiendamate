import { createServer } from "../server/index";

const app = createServer();

// Ensure requests without /api prefix match our Express API routes when rewritten on Vercel
app.use((req, res, next) => {
  if (!req.url.startsWith("/api") && req.url !== "/health") {
    req.url = "/api" + (req.url.startsWith("/") ? req.url : "/" + req.url);
  }
  next();
});

export default function handler(req: any, res: any) {
  return app(req, res);
}
