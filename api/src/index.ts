import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { ZodError } from "zod";
import { prisma } from "./db";
import { env } from "./env";
import { router } from "./routes";

const app = express();

app.disable("x-powered-by");
app.use(cors({ origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",") }));
app.use(express.json({ limit: "100kb" }));
app.use(router);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Invalid request",
      issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
});

const server = app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`Local events API listening on http://0.0.0.0:${env.PORT}`);
});

const shutdown = () => {
  server.close(() => {
    prisma.$disconnect().finally(() => process.exit(0));
  });
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
