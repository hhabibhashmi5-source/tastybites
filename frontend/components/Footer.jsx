// V2 footer — full-bleed forest, oversized wordmark, working links + newsletter.
import Link from "next/link";
import { Phone, MapPin, Mail } from "lucide-react";
import NewsletterForm from "@/components/NewsletterForm";

export default function Footer() {
  return (
    <footer className="mt-auto bg-forest text-cream">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        {/* Top: wordmark + newsletter */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Link
            href="/"
            className="block font-display text-6xl leading-none tracking-tight sm:text-8xl"
          >
            Tasty <span className="italic text-mustard">Bites</span>
          </Link>

          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.2em] text-mustard">
              Get 25% off your first order
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Ticket-style info strip — all links work */}
        <div className="mt-10 flex flex-col gap-6 border-t border-dashed border-cream/20 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-cream/80">
            <span className="text-cream/80">
              <span className="text-mustard">Open</span> · 11am – 11pm daily
            </span>
            <a
              href="https://maps.google.com/?q=123+Garden+Street"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-orange-soft"
            >
              <MapPin className="h-4 w-4" /> 123 Garden Street
            </a>
            <a
              href="tel:+15550123456"
              className="flex items-center gap-1.5 transition-colors hover:text-orange-soft"
            >
              <Phone className="h-4 w-4" /> (555) 012-3456
            </a>
            <a
              href="mailto:hello@tastybites.com"
              className="flex items-center gap-1.5 transition-colors hover:text-orange-soft"
            >
              <Mail className="h-4 w-4" /> hello@tastybites.com
            </a>
          </div>

          {/* Socials */}
          <div className="flex items-center gap-5 text-xs uppercase tracking-[0.16em] text-cream/70">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-orange-soft"
            >
              Facebook
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-orange-soft"
            >
              Instagram
            </a>
          </div>
        </div>

        {/* Bottom nav + copyright */}
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex gap-6 text-xs uppercase tracking-[0.16em] text-cream/70">
            <Link href="/" className="transition-colors hover:text-orange-soft">
              Home
            </Link>
            <Link href="/menu" className="transition-colors hover:text-orange-soft">
              Menu
            </Link>
            <Link href="/cart" className="transition-colors hover:text-orange-soft">
              Cart
            </Link>
            <Link href="/contact" className="transition-colors hover:text-orange-soft">
              Contact
            </Link>
          </nav>
          <p className="text-xs text-cream/50">
            © 2026 TastyBites · Fast food, finely done.
          </p>
        </div>
      </div>
    </footer>
  );
}
