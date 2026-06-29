// Wraps content and plays the zoom-in animation when it scrolls into view.
"use client";

import { useEffect, useRef, useState } from "react";

export default function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${shown ? "zoom-in-show" : "zoom-in-hidden"} ${className}`}
      style={shown && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
