// "Leave a review" form for the home page. Posts to /api/reviews; the review
// is stored hidden until an admin approves it, so we tell the customer that.
"use client";

import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ReviewForm() {
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, comment, rating }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Could not submit your review.");
        return;
      }
      toast.success("Thanks! Your review will appear once it's approved.");
      setName("");
      setComment("");
      setRating(5);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mt-10 w-full max-w-xl rounded-2xl border border-border bg-card p-6 sm:p-8"
    >
      <p className="text-center text-xs uppercase tracking-[0.2em] text-mustard">
        Tried us out?
      </p>
      <h3 className="mt-1 text-center font-display text-2xl">Leave a review</h3>

      {/* Star picker */}
      <div className="mt-5 flex justify-center gap-1.5">
        {Array.from({ length: 5 }).map((_, i) => {
          const value = i + 1;
          const active = value <= (hover || rating);
          return (
            <button
              key={value}
              type="button"
              aria-label={`${value} star${value > 1 ? "s" : ""}`}
              onClick={() => setRating(value)}
              onMouseEnter={() => setHover(value)}
              onMouseLeave={() => setHover(0)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={
                  active
                    ? "h-7 w-7 fill-mustard text-mustard"
                    : "h-7 w-7 text-muted-foreground/40"
                }
                strokeWidth={active ? 0 : 1.5}
              />
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-4">
        <input
          type="text"
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full rounded-xl border border-input bg-transparent px-4 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <textarea
          required
          rows={3}
          maxLength={500}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us what you loved…"
          className="w-full resize-none rounded-xl border border-input bg-transparent px-4 py-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-orange py-3 text-sm font-semibold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#b34d22] disabled:opacity-70"
      >
        {pending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
          </>
        ) : (
          "Submit review"
        )}
      </button>
    </form>
  );
}
