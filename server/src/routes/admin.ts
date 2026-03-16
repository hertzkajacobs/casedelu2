import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAdmin } from "../middleware/auth";
import { logAction } from "../lib/audit";

export const adminRoutes = Router();

adminRoutes.get("/departments", async (_req, res) => {
  const departments = await prisma.department.findMany({ orderBy: { name: "asc" } });
  res.json(departments);
});

adminRoutes.post("/departments", requireAdmin, async (req, res) => {
  const { name, escalationSeconds } = req.body;
  const department = await prisma.department.create({
    data: { name, escalationSeconds }
  });
  await logAction("admin", "department.create", { id: department.id, name });
  res.status(201).json(department);
});

adminRoutes.get("/routes", async (_req, res) => {
  const routes = await prisma.buttonRoute.findMany({ include: { department: true } });
  res.json(routes.map((route) => ({ id: route.id, buttonName: route.buttonName, department: route.department.name })));
});

adminRoutes.put("/routes/:id", requireAdmin, async (req, res) => {
  const updated = await prisma.buttonRoute.update({
    where: { id: req.params.id },
    data: { departmentId: req.body.departmentId }
  });
  await logAction("admin", "route.update", { id: updated.id, departmentId: updated.departmentId });
  res.json(updated);
});

adminRoutes.get("/visitor-logs", async (_req, res) => {
  const logs = await prisma.visitor.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, name: true, visitReason: true, createdAt: true }
  });
  res.json(logs);
});

adminRoutes.get("/call-logs", requireAdmin, async (_req, res) => {
  const calls = await prisma.call.findMany({ orderBy: { startedAt: "desc" } });
  res.json(calls);
});

adminRoutes.get("/devices", requireAdmin, async (_req, res) => {
  const devices = await prisma.device.findMany({ orderBy: { lastSeen: "desc" } });
  res.json(devices);
});
