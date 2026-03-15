import { Router } from "express";
import { CheckinType } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { encryptVisitorLog } from "../lib/security";
import { logAction } from "../lib/audit";

export function checkinRoutes(emitAlert: (payload: Record<string, string>) => void) {
  const router = Router();

  router.post("/delivery", async (req, res) => {
    const { company, recipientName, notes } = req.body;
    const visitor = await prisma.visitor.create({
      data: {
        name: recipientName,
        visitReason: "Delivery",
        encryptedBlob: encryptVisitorLog({ company, recipientName, notes })
      }
    });

    const checkin = await prisma.checkin.create({
      data: { type: CheckinType.DELIVERY, visitorId: visitor.id }
    });

    emitAlert({ id: checkin.id, type: "Delivery", department: "BHT", createdAt: new Date().toISOString() });
    await logAction("kiosk", "checkin.delivery", { checkinId: checkin.id });
    res.status(201).json({ id: checkin.id });
  });

  router.post("/patient", async (req, res) => {
    const { firstName, lastInitial, dob } = req.body;
    const visitor = await prisma.visitor.create({
      data: {
        name: `${firstName} ${lastInitial}.`,
        visitReason: "Patient Check-In",
        encryptedBlob: encryptVisitorLog({ firstName, lastInitial, dob })
      }
    });

    const checkin = await prisma.checkin.create({ data: { type: CheckinType.PATIENT, visitorId: visitor.id } });
    emitAlert({ id: checkin.id, type: "Patient Check-In", department: "Admissions", createdAt: new Date().toISOString() });
    await logAction("kiosk", "checkin.patient", { checkinId: checkin.id });
    res.status(201).json({ id: checkin.id });
  });

  router.post("/visitor", async (req, res) => {
    const { name, phone, personVisiting, relationship, signature, agreed } = req.body;
    if (!agreed || !signature) {
      return res.status(400).json({ error: "Policy agreement and signature are required" });
    }

    const visitor = await prisma.visitor.create({
      data: {
        name,
        phone,
        visitReason: "Visitor Check-In",
        personVisiting,
        relationship,
        signature,
        encryptedBlob: encryptVisitorLog({ name, phone, personVisiting, relationship, signature })
      }
    });

    const checkin = await prisma.checkin.create({ data: { type: CheckinType.VISITOR, visitorId: visitor.id } });
    emitAlert({ id: checkin.id, type: "Visitor Check-In", department: "BHT", createdAt: new Date().toISOString() });
    await logAction("kiosk", "checkin.visitor", { checkinId: checkin.id });
    return res.status(201).json({ id: checkin.id });
  });

  return router;
}
