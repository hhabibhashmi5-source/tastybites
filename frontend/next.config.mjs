/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow the dev server's JS/HMR assets to be served to the ngrok tunnel host,
  // so the site is fully interactive (tabs, cart, etc.) when shared publicly.
  // Add new ngrok hostnames here if the tunnel URL changes.
  allowedDevOrigins: ["ludicrous-surrender-paradox.ngrok-free.dev"],
  experimental: {
    serverActions: {
      // Allow menu-image uploads through Server Actions (default is 1 MB).
      // The addMenuItem action itself caps images at 5 MB; this leaves headroom
      // for multipart overhead.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
