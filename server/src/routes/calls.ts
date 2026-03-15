import { CallStatus } from "@prisma/client";
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { logAction } from "../lib/audit";

export function callRoutes(emitAlert: (payload: Record<string, string>) => void) {
  const router = Router();

  router.post("/start", async (req, res) => {
    const { department } = req.body;
    const call = await prisma.call.create({ data: { department, status: CallStatus.REQUESTED } });
    emitAlert({ id: call.id, type: "Intercom Request", department, createdAt: call.startedAt.toISOString() });
    await logAction("kiosk", "call.start", { callId: call.id, department });
    res.status(201).json(call);
  });

  router.post("/:id/accept", async (req, res) => {
    const call = await prisma.call.update({
      where: { id: req.params.id },
      data: { status: CallStatus.ACTIVE }
    });
    await logAction("staff", "call.accept", { callId: call.id });
    res.json(call);
  });

  router.post("/:id/complete", async (req, res) => {
    const call = await prisma.call.update({
      where: { id: req.params.id },
      data: { status: CallStatus.ENDED, endedAt: new Date() }
    });
    await logAction("staff", "call.complete", { callId: call.id });
    res.json(call);
  });

  router.post("/signal", async (req, res) => {
    await logAction("webrtc", "signal.exchange", { room: req.body.roomId, type: req.body.type });
    res.status(200).json({ ok: true });
  });

  return router;
}
