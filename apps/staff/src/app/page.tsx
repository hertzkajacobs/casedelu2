"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Alert = {
  id: string;
  type: string;
  department: string;
  createdAt: string;
};

export default function StaffDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [status, setStatus] = useState("Disconnected");

  useEffect(() => {
    const socket: Socket = io(API_URL, { transports: ["websocket"] });
    socket.on("connect", () => setStatus("Connected"));
    socket.on("disconnect", () => setStatus("Disconnected"));
    socket.on("alert:new", (alert: Alert) => setAlerts((previous) => [alert, ...previous]));
    return () => socket.disconnect();
  }, []);

  const handleCall = async (id: string, action: "accept" | "complete") => {
    await fetch(`${API_URL}/api/calls/${id}/${action}`, { method: "POST" });
    setAlerts((previous) => previous.filter((alert) => alert.id !== id));
  };

  return (
    <main className="mx-auto min-h-screen max-w-5xl p-8">
      <header className="mb-6 flex items-center justify-between rounded-2xl bg-white p-6 shadow">
        <div>
          <h1 className="text-3xl font-bold">Staff Intercom Console</h1>
          <p className="text-slate-600">Receive alerts, answer calls, and mark visitors handled.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-4 py-2 font-medium">{status}</span>
      </header>

      <section className="space-y-4">
        {alerts.length === 0 && <p className="rounded-2xl bg-white p-6 shadow">No active alerts.</p>}
        {alerts.map((alert) => (
          <article key={alert.id} className="rounded-2xl bg-white p-6 shadow">
            <p className="text-sm text-slate-500">{new Date(alert.createdAt).toLocaleString()}</p>
            <h2 className="text-2xl font-semibold">{alert.type}</h2>
            <p className="mt-1">Department: {alert.department}</p>
            <div className="mt-4 flex gap-3">
              <button className="rounded-xl bg-brand px-5 py-2 text-white" onClick={() => handleCall(alert.id, "accept")}>
                Accept Intercom
              </button>
              <button className="rounded-xl border border-slate-300 px-5 py-2" onClick={() => handleCall(alert.id, "complete")}>
                Mark Handled
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
