"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

type Flow = "home" | "delivery" | "patient" | "visitor" | "assist";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export default function KioskHome() {
  const [flow, setFlow] = useState<Flow>("home");
  const [message, setMessage] = useState<string>("");
  const [agreed, setAgreed] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  const submit = async (endpoint: string, payload: Record<string, unknown>) => {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error("Unable to submit check-in");
    }
  };

  const signature = useMemo(() => canvasRef.current?.toDataURL("image/png") ?? "", [drawing]);

  const reset = () => {
    setFlow("home");
    setMessage("");
    setAgreed(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const buttonClass = "rounded-2xl bg-brand px-8 py-6 text-2xl font-semibold text-white hover:bg-teal-700";

  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-6 p-6">
      <section className="rounded-3xl bg-white p-8 shadow-lg">
        <h1 className="text-4xl font-bold text-slate-900">Welcome</h1>
        <p className="mt-2 text-xl text-slate-600">How can we help you today?</p>
      </section>

      {flow === "home" && (
        <section className="grid gap-4 md:grid-cols-2">
          <button className={buttonClass} onClick={() => setFlow("delivery")}>Delivery</button>
          <button className={buttonClass} onClick={() => setFlow("patient")}>Patient Check-In</button>
          <button className={buttonClass} onClick={() => setFlow("visitor")}>Visitor Check-In</button>
          <button className={buttonClass} onClick={() => setFlow("assist")}>Need Assistance</button>
        </section>
      )}

      {flow === "delivery" && (
        <FormCard
          title="Delivery Check-In"
          onCancel={reset}
          onSubmit={async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            await submit("/api/checkins/delivery", {
              company: formData.get("company"),
              recipientName: formData.get("recipientName"),
              notes: formData.get("notes")
            });
            setMessage("Thank you. Someone will be with you shortly.");
          }}
        >
          <Input name="company" label="Delivery company" required />
          <Input name="recipientName" label="Recipient name" required />
          <Input name="notes" label="Optional notes" />
        </FormCard>
      )}

      {flow === "patient" && (
        <FormCard
          title="Patient Check-In"
          onCancel={reset}
          onSubmit={async (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            await submit("/api/checkins/patient", {
              firstName: formData.get("firstName"),
              lastInitial: formData.get("lastInitial"),
              dob: formData.get("dob")
            });
            setMessage("Admissions has been notified.");
          }}
        >
          <Input name="firstName" label="First Name" required />
          <Input name="lastInitial" label="Last Initial" required maxLength={1} />
          <Input name="dob" type="date" label="Date of Birth (optional)" />
        </FormCard>
      )}

      {flow === "visitor" && (
        <FormCard
          title="Visitor Check-In"
          onCancel={reset}
          onSubmit={async (event) => {
            event.preventDefault();
            if (!agreed || !signature) {
              throw new Error("Signature and policy agreement are required");
            }
            const formData = new FormData(event.currentTarget);
            await submit("/api/checkins/visitor", {
              name: formData.get("name"),
              phone: formData.get("phone"),
              personVisiting: formData.get("personVisiting"),
              relationship: formData.get("relationship"),
              signature,
              agreed
            });
            setMessage("BHT has been notified.");
          }}
        >
          <Input name="name" label="Visitor Name" required />
          <Input name="phone" label="Phone Number" required />
          <Input name="personVisiting" label="Who are you visiting" required />
          <Input name="relationship" label="Relationship" required />
          <label className="text-sm font-medium text-slate-600">Signature</label>
          <canvas
            ref={canvasRef}
            width={600}
            height={180}
            className="w-full rounded-xl border border-slate-300 bg-white"
            onPointerDown={(event) => {
              setDrawing(true);
              const ctx = canvasRef.current?.getContext("2d");
              if (!ctx) return;
              ctx.beginPath();
              ctx.moveTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
            }}
            onPointerMove={(event) => {
              if (!drawing) return;
              const ctx = canvasRef.current?.getContext("2d");
              if (!ctx) return;
              ctx.lineTo(event.nativeEvent.offsetX, event.nativeEvent.offsetY);
              ctx.strokeStyle = "#0f172a";
              ctx.lineWidth = 2;
              ctx.stroke();
            }}
            onPointerUp={() => setDrawing(false)}
          />
          <label className="flex items-center gap-2 text-lg">
            <input type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
            I agree to facility visitor policies
          </label>
        </FormCard>
      )}

      {flow === "assist" && (
        <section className="rounded-3xl bg-white p-8 shadow-lg">
          <h2 className="text-3xl font-semibold">Connecting to staff…</h2>
          <p className="mt-2 text-slate-600">Please wait while we connect your intercom call.</p>
          <button
            className="mt-6 rounded-xl bg-brand px-6 py-3 text-white"
            onClick={async () => {
              await submit("/api/calls/start", { department: "BHT" });
              setMessage("A staff member will answer shortly.");
            }}
          >
            Start Intercom Call
          </button>
          <button className="ml-3 rounded-xl border border-slate-300 px-6 py-3" onClick={reset}>
            Back
          </button>
        </section>
      )}

      {message && (
        <section className="rounded-2xl bg-emerald-50 p-6 text-xl text-emerald-900">
          {message}
          <button className="ml-4 underline" onClick={reset}>Return Home</button>
        </section>
      )}
    </main>
  );
}

function FormCard({
  title,
  onSubmit,
  onCancel,
  children
}: {
  title: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onCancel: () => void;
  children: React.ReactNode;
}) {
  const [error, setError] = useState<string>("");

  return (
    <form
      className="space-y-4 rounded-3xl bg-white p-8 shadow-lg"
      onSubmit={async (event) => {
        try {
          await onSubmit(event);
          setError("");
        } catch (submissionError) {
          setError(submissionError instanceof Error ? submissionError.message : "Submission failed");
        }
      }}
    >
      <h2 className="text-3xl font-semibold">{title}</h2>
      {children}
      {error && <p className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
      <div className="flex gap-3">
        <button className="rounded-xl bg-brand px-6 py-3 text-white" type="submit">
          Submit
        </button>
        <button className="rounded-xl border border-slate-300 px-6 py-3" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}

function Input({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="flex flex-col gap-2 text-lg">
      <span className="font-medium text-slate-700">{label}</span>
      <input className="rounded-xl border border-slate-300 px-4 py-3 text-lg" {...props} />
    </label>
  );
}
