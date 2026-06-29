// A small working newsletter signup — validates and confirms with a toast.
"use client";

import { useState } from "react";
import { toast } from "sonner";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!valid) {
      toast.error("Please enter a valid email address.");
      return;
    }
    toast.success("You're subscribed — 25% off is on its way! 🎉");
    setEmail("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@email.com"
        aria-label="Email address"
        className="min-w-0 flex-1 rounded-full border border-cream/20 bg-cream/5 px-4 py-2.5 text-sm text-cream placeholder:text-cream/40 focus:border-mustard focus:outline-none"
      />
      <button
        type="submit"
        className="flex-none rounded-full bg-orange px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#b34d22]"
      >
        Join
      </button>
    </form>
  );
}
