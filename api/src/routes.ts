import bcrypt from "bcryptjs";
import { Router, type NextFunction, type Request, type Response } from "express";
import { z } from "zod";
import { requireAuth, requireRole, signToken } from "./auth";
import { prisma } from "./db";

export const EVENT_TYPES = ["MUSIC", "FOOD", "FAMILY", "SPORTS", "ARTS"] as const;

const ListQuery = z
  .object({
    type: z.enum(EVENT_TYPES).optional(),
    from: z.iso.datetime({ offset: true }).optional(),
    to: z.iso.datetime({ offset: true }).optional(),
  })
  .refine((q) => !q.from || !q.to || new Date(q.from) < new Date(q.to), {
    message: "'from' must be before 'to'",
  });

const IdParam = z.object({ id: z.string().min(1).max(100) });

const LoginBody = z.object({
  email: z.email().transform((e) => e.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

const CreateEventBody = z
  .object({
    id: z
      .string()
      .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes")
      .min(3)
      .max(80),
    title: z.string().min(3).max(140),
    type: z.enum(EVENT_TYPES),
    description: z.string().min(10).max(4000),
    venue: z.string().min(2).max(140),
    address: z.string().min(2).max(240),
    city: z.string().min(2).max(80),
    startsAt: z.iso.datetime({ offset: true }),
    endsAt: z.iso.datetime({ offset: true }),
    priceLabel: z.string().min(1).max(60),
    ticketUrl: z.url({ protocol: /^https?$/ }),
    imageUrl: z.url({ protocol: /^https?$/ }).optional(),
  })
  .refine((e) => new Date(e.startsAt) < new Date(e.endsAt), {
    message: "Event must end after it starts",
    path: ["endsAt"],
  });

type Handler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
const wrap = (fn: Handler) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res, next).catch(next);
};

export const router = Router();

router.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "ok", time: new Date().toISOString() });
  } catch {
    res.status(503).json({ status: "degraded", db: "unreachable" });
  }
});

// Public: event list with optional type and time-window filters.
router.get(
  "/events",
  wrap(async (req, res) => {
    const q = ListQuery.parse(req.query);
    const events = await prisma.event.findMany({
      where: {
        type: q.type,
        // An event belongs to a window if it overlaps it.
        ...(q.to ? { startsAt: { lt: new Date(q.to) } } : {}),
        ...(q.from ? { endsAt: { gt: new Date(q.from) } } : { endsAt: { gt: new Date() } }),
      },
      orderBy: { startsAt: "asc" },
      take: 200,
    });
    res.json({ events });
  }),
);

// Public: event detail.
router.get(
  "/events/:id",
  wrap(async (req, res) => {
    const { id } = IdParam.parse(req.params);
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    res.json({ event });
  }),
);

// Admin only: create an event.
router.post(
  "/events",
  requireAuth,
  requireRole("ADMIN"),
  wrap(async (req, res) => {
    const body = CreateEventBody.parse(req.body);
    const event = await prisma.event.create({
      data: { ...body, startsAt: new Date(body.startsAt), endsAt: new Date(body.endsAt) },
    });
    res.status(201).json({ event });
  }),
);

router.post(
  "/auth/login",
  wrap(async (req, res) => {
    const { email, password } = LoginBody.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ error: "Email or password is incorrect" });
      return;
    }
    const token = signToken({ id: user.id, email: user.email, role: user.role });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } });
  }),
);

router.get(
  "/auth/me",
  requireAuth,
  wrap(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!user) {
      res.status(401).json({ error: "Account no longer exists" });
      return;
    }
    res.json({ user });
  }),
);

router.get(
  "/me/saved",
  requireAuth,
  wrap(async (req, res) => {
    const saved = await prisma.savedEvent.findMany({
      where: { userId: req.user!.id },
      include: { event: true },
      orderBy: { event: { startsAt: "asc" } },
    });
    res.json({ events: saved.map((s) => s.event) });
  }),
);

router.put(
  "/me/saved/:id",
  requireAuth,
  wrap(async (req, res) => {
    const { id } = IdParam.parse(req.params);
    const event = await prisma.event.findUnique({ where: { id }, select: { id: true } });
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }
    await prisma.savedEvent.upsert({
      where: { userId_eventId: { userId: req.user!.id, eventId: id } },
      create: { userId: req.user!.id, eventId: id },
      update: {},
    });
    res.status(204).end();
  }),
);

router.delete(
  "/me/saved/:id",
  requireAuth,
  wrap(async (req, res) => {
    const { id } = IdParam.parse(req.params);
    await prisma.savedEvent.deleteMany({ where: { userId: req.user!.id, eventId: id } });
    res.status(204).end();
  }),
);
