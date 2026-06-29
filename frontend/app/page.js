// The HOME page (shows at "/") — told as a story, hero → close.
import Link from "next/link";
import { Flame, Truck, Clock, Star } from "lucide-react";
import { getMenuItems, getApprovedReviews } from "@/lib/menu-data";
import MenuCard from "@/components/MenuCard";
import Reveal from "@/components/Reveal";
import ReviewForm from "@/components/ReviewForm";

export const revalidate = 60;

const FEATURES = [
  { icon: Flame, label: "Cooked to order" },
  { icon: Truck, label: "Free delivery over $20" },
  { icon: Clock, label: "30-min average" },
];

const STATS = [
  ["12,000+", "meals served"],
  ["4.8★", "average rating"],
  ["30 min", "avg delivery"],
  ["100%", "fresh daily"],
];

const STEPS = [
  ["01", "Pick your favorites", "Browse fast food, drinks & desserts and build your order."],
  ["02", "Check out in seconds", "Apply your 25% welcome offer right at the cart."],
  ["03", "We cook & deliver hot", "Freshly made and tracked from the grill to your door."],
];

const REVIEWS = [
  ["Best loaded fries in the city — and they actually arrived hot.", "Sara M."],
  ["Ordered in two minutes and ate like a king. New regular spot.", "Daniel R."],
  ["The chocolate brownie alone is worth the order. Unreal.", "Aisha K."],
];

export default async function Home() {
  const [items, approvedReviews] = await Promise.all([
    getMenuItems(),
    getApprovedReviews(6),
  ]);
  const picks = items.filter((i) => i.featured);
  const thumbs = picks.slice(0, 3);

  // Show admin-approved customer reviews; until any are approved, fall back to
  // the built-in examples so the section is never empty.
  const reviews =
    approvedReviews.length > 0
      ? approvedReviews
      : REVIEWS.map(([comment, name], i) => ({
          id: `fallback-${i}`,
          name,
          comment,
          rating: 5,
        }));

  return (
    <main>
      {/* ---------- HERO (kept) ---------- */}
      <section className="bg-cream">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-2 lg:py-20">
          <div>
            <p className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-mustard">
              <span className="text-olive">🌿</span> Welcome to TastyBites
            </p>
            <h1 className="font-display text-5xl font-bold leading-[1.05] sm:text-6xl">
              Have a <span className="text-orange">delicious</span> meal with
              us.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
              A place where friends and family gather over burgers, fresh
              drinks, and desserts — all made to order and delivered hot.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/menu"
                className="rounded-full bg-orange px-7 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#b34d22]"
              >
                View Our Menu
              </Link>
              <Link
                href="/menu"
                className="rounded-full border border-foreground/20 px-7 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-foreground transition-colors hover:border-olive hover:text-olive"
              >
                Book a Table
              </Link>
            </div>

            <div className="mt-10 flex gap-4">
              {thumbs.map((item) => (
                <Link
                  key={item.id}
                  href="/menu"
                  className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-2 pr-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    loading="lazy"
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                  <div className="hidden sm:block">
                    <p className="text-xs font-semibold leading-tight">
                      {item.name}
                    </p>
                    <span className="text-xs text-orange">Order Now</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xs sm:max-w-sm">
            <div className="overflow-hidden rounded-[28px] border border-border shadow-md">
              <img
                src="/images/hero.jpg"
                alt="A delicious spread of food"
                className="aspect-square w-full object-cover"
              />
            </div>
            <div className="absolute -right-3 -top-3 flex h-20 w-20 flex-col items-center justify-center rounded-full bg-orange text-cream shadow-lg sm:h-24 sm:w-24">
              <span className="font-display text-2xl font-bold leading-none">25%</span>
              <span className="text-xs uppercase tracking-widest">Off</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- 1. WHY US ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div className="relative flex justify-center">
            <div className="absolute h-64 w-64 rounded-full bg-orange/90 sm:h-72 sm:w-72" />
            <img
              src="/images/salad.jpg"
              alt="A fresh plated meal"
              className="relative h-64 w-64 rounded-full border-8 border-cream object-cover shadow-lg sm:h-72 sm:w-72"
            />
          </div>

          <Reveal>
            <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-mustard">
              <span className="text-olive">🌿</span> Why TastyBites
            </p>
            <h2 className="font-display text-3xl leading-tight sm:text-4xl">
              Made to order, never made to wait.
            </h2>
            <p className="mt-5 max-w-lg leading-relaxed text-muted-foreground">
              Every burger is grilled the second you tap order — no heat lamps,
              no shortcuts. Real ingredients, big flavor, on your doorstep in 30
              minutes or less.
            </p>

            <div className="mt-8 flex flex-wrap gap-8">
              {FEATURES.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-olive/10 text-olive">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------- 2. BY THE NUMBERS ---------- */}
      <section className="bg-forest text-cream">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 py-14 sm:px-8 lg:grid-cols-4">
          {STATS.map(([value, label]) => (
            <div key={label} className="text-center">
              <p className="font-display text-4xl text-mustard sm:text-5xl">
                {value}
              </p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-cream/70">
                {label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------- 3. HOW IT WORKS ---------- */}
      <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <Reveal className="text-center">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-mustard">
            Order in 3 steps
          </p>
          <h2 className="font-display text-3xl sm:text-4xl">
            From craving to doorstep in three taps.
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map(([num, title, body], i) => (
            <Reveal
              key={num}
              delay={i * 120}
              className="relative rounded-2xl border border-border bg-card p-7"
            >
              <span className="font-display text-5xl text-orange/25">{num}</span>
              <h3 className="mt-3 font-display text-xl">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {body}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------- 4. POPULAR PICKS ---------- */}
      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <Reveal>
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-mustard">
              Crowd favorites
            </p>
            <h2 className="font-display text-3xl sm:text-4xl">The crowd favorites.</h2>
          </Reveal>
          <Link
            href="/menu"
            className="rounded-full border border-olive px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.12em] text-olive transition-colors hover:bg-olive hover:text-cream"
          >
            View full menu →
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {picks.map((item) => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>
      </section>

      {/* ---------- 5. TESTIMONIALS ---------- */}
      <section className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        <Reveal className="text-center">
          <p className="mb-2 text-xs uppercase tracking-[0.3em] text-mustard">
            Loved locally
          </p>
          <h2 className="font-display text-3xl sm:text-4xl">
            Don&apos;t take our word for it.
          </h2>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {reviews.map((review, i) => (
            <Reveal key={review.id} delay={i * 120} className="h-full">
              <figure className="flex h-full flex-col rounded-2xl border border-border bg-card p-7">
                <div className="mb-4 flex gap-0.5 text-mustard">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      className={
                        s < review.rating
                          ? "h-4 w-4 fill-mustard text-mustard"
                          : "h-4 w-4 text-muted-foreground/30"
                      }
                      strokeWidth={s < review.rating ? 0 : 1.5}
                    />
                  ))}
                </div>
                <blockquote className="flex-1 text-lg leading-relaxed">
                  “{review.comment}”
                </blockquote>
                <figcaption className="mt-5 text-sm font-semibold text-olive">
                  — {review.name}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>

        {/* Customer review submission */}
        <ReviewForm />
      </section>

      {/* ---------- 6. FINAL CTA ---------- */}
      <section className="bg-forest text-cream">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center sm:px-8">
          <h2 className="font-display text-4xl sm:text-5xl">Hungry yet?</h2>
          <p className="mx-auto mt-4 max-w-md text-cream/75">
            Get 25% off your first order — open daily, 11am to 11pm.
          </p>
          <Link
            href="/menu"
            className="mt-8 inline-block rounded-full bg-orange px-9 py-3.5 text-sm font-semibold uppercase tracking-[0.12em] text-cream transition-colors hover:bg-[#b34d22]"
          >
            Order Now
          </Link>
        </div>
      </section>
    </main>
  );
}
