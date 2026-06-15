import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const projectRoot = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the tracing root (a stray parent lockfile otherwise misplaces it).
  outputFileTracingRoot: projectRoot,
  // The corpus index is imported as JSON at runtime on the server; keep it bundled.
  outputFileTracingIncludes: {
    "/api/**": ["./corpus/index.json"],
  },
};

export default nextConfig;
