// Contact page (/contact) — a validated form that stores messages in Supabase.
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, MapPin, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  // Returns an error string for a single field ("" means it's valid).
  function fieldError(field, value) {
    const v = value.trim();
    if (field === "name") return v ? "" : "Please enter your name.";
    if (field === "email")
      return EMAIL_RE.test(v) ? "" : "Please enter a valid email.";
    if (field === "message") {
      if (!v) return "Please write a message.";
      if (v.length > 2000) return "Message is too long (2000 char max).";
    }
    return "";
  }

  function update(field) {
    return (e) => {
      const value = e.target.value;
      setForm((f) => ({ ...f, [field]: value }));
      // Only update the error live once the field has been touched — so we don't
      // nag with "invalid email" while the user is still typing it the first time.
      if (touched[field]) {
        setErrors((prev) => ({ ...prev, [field]: fieldError(field, value) }));
      }
    };
  }

  // Validate a field when the user clicks away from it.
  function handleBlur(field) {
    return (e) => {
      setTouched((t) => ({ ...t, [field]: true }));
      setErrors((prev) => ({ ...prev, [field]: fieldError(field, e.target.value) }));
    };
  }

  function validate() {
    const next = {};
    for (const field of ["name", "email", "message"]) {
      const err = fieldError(field, form[field]);
      if (err) next[field] = err;
    }
    setErrors(next);
    setTouched({ name: true, email: true, message: true });
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        throw new Error(data.error || "Could not send message.");
      }
      toast.success("Thanks! Your message has been sent. 🎉");
      setForm({ name: "", email: "", message: "" });
      setErrors({});
    } catch (err) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
      <p className="mb-2 text-xs uppercase tracking-[0.3em] text-mustard">
        Get in touch
      </p>
      <h1 className="font-display text-4xl sm:text-5xl">Contact us</h1>
      <p className="mt-4 max-w-md text-muted-foreground">
        Questions, feedback, or a catering request? Send us a note and we&apos;ll
        get back to you.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_320px]">
        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={form.name} onChange={update("name")} onBlur={handleBlur("name")} placeholder="Your name" />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email} onChange={update("email")} onBlur={handleBlur("email")} placeholder="you@email.com" />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message">Message</Label>
            <textarea
              id="message"
              value={form.message}
              onChange={update("message")}
              onBlur={handleBlur("message")}
              rows={5}
              placeholder="How can we help?"
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {errors.message && <p className="text-xs text-destructive">{errors.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 rounded-full bg-orange px-8 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#b34d22] disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Sending…
              </>
            ) : (
              "Send message"
            )}
          </button>
        </form>

        {/* Details */}
        <aside className="space-y-5 rounded-2xl border border-border bg-card p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-mustard">Find us</p>
          <a
            href="https://maps.google.com/?q=123+Garden+Street"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-sm transition-colors hover:text-olive"
          >
            <MapPin className="h-4 w-4 text-olive" /> 123 Garden Street
          </a>
          <a
            href="tel:+15550123456"
            className="flex items-center gap-3 text-sm transition-colors hover:text-olive"
          >
            <Phone className="h-4 w-4 text-olive" /> (555) 012-3456
          </a>
          <a
            href="mailto:hello@tastybites.com"
            className="flex items-center gap-3 text-sm transition-colors hover:text-olive"
          >
            <Mail className="h-4 w-4 text-olive" /> hello@tastybites.com
          </a>
          <p className="text-sm text-muted-foreground">Open daily · 11am – 11pm</p>
        </aside>
      </div>
    </main>
  );
}
