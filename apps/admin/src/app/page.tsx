"use client";

import { FormEvent, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type Department = { id: string; name: string; escalationSeconds: number };
type Route = { id: string; buttonName: string; department: string };

type VisitorLog = {
  id: string;
  name: string;
  visitReason: string;
  createdAt: string;
};

export default function AdminDashboard() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [logs, setLogs] = useState<VisitorLog[]>([]);

  const load = async () => {
    const [deptRes, routeRes, logRes] = await Promise.all([
      fetch(`${API_URL}/api/admin/departments`),
      fetch(`${API_URL}/api/admin/routes`),
      fetch(`${API_URL}/api/admin/visitor-logs`)
    ]);

    setDepartments(await deptRes.json());
    setRoutes(await routeRes.json());
    setLogs(await logRes.json());
  };

  useEffect(() => {
    load();
  }, []);

  const addDepartment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await fetch(`${API_URL}/api/admin/departments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer demo-admin-token" },
      body: JSON.stringify({
        name: data.get("name"),
        escalationSeconds: Number(data.get("escalationSeconds") || 30)
      })
    });
    await load();
    event.currentTarget.reset();
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-8 p-8">
      <header className="rounded-2xl bg-white p-6 shadow">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-slate-600">Manage routing, departments, logs, and escalation settings.</p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">Create Department</h2>
          <form className="mt-4 space-y-3" onSubmit={addDepartment}>
            <input className="w-full rounded-lg border p-2" name="name" placeholder="Department name" required />
            <input className="w-full rounded-lg border p-2" name="escalationSeconds" type="number" min={5} defaultValue={30} />
            <button className="rounded-lg bg-brand px-4 py-2 text-white" type="submit">Create</button>
          </form>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-xl font-semibold">Button Routing</h2>
          <ul className="mt-3 space-y-2">
            {routes.map((route) => (
              <li key={route.id} className="rounded-lg bg-slate-50 p-3">
                {route.buttonName} → {route.department}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-xl font-semibold">Visitor Logs</h2>
        <div className="mt-3 overflow-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-2">Name</th>
                <th className="p-2">Reason</th>
                <th className="p-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b">
                  <td className="p-2">{log.name}</td>
                  <td className="p-2">{log.visitReason}</td>
                  <td className="p-2">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow">
        <h2 className="text-xl font-semibold">Configured Departments</h2>
        <ul className="mt-3 space-y-2">
          {departments.map((department) => (
            <li key={department.id} className="rounded-lg bg-slate-50 p-3">
              {department.name} (Escalation: {department.escalationSeconds}s)
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
