import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  ...(process.env.NEXT_OUTPUT_MODE === "standalone"
    ? { output: "standalone" as const }
    : {}),
  reactCompiler: true,
};

export default withNextIntl(nextConfig);
