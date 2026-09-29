import type { NextConfig } from "next";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

type InventoryModule = { resource?: string; modules?: Iterable<InventoryModule> };
type InventoryCompilation = {
  chunks: Iterable<unknown>;
  chunkGraph: { getChunkModulesIterable: (chunk: unknown) => Iterable<InventoryModule> };
};
type InventoryCompiler = {
  hooks: {
    afterEmit: {
      tap: (name: string, callback: (compilation: InventoryCompilation) => void) => void;
    };
  };
};

const nextConfig: NextConfig = {
  webpack(config, { dev, isServer, nextRuntime }) {
    if (!dev) {
      config.plugins.push({
        apply(compiler: InventoryCompiler) {
          compiler.hooks.afterEmit.tap("ThirdPartyInventory", (compilation) => {
            const resources = new Set<string>();
            function collect(webpackModule: InventoryModule) {
              const resource = webpackModule.resource;
              if (resource?.includes("node_modules/")) {
                resources.add(path.relative(process.cwd(), resource.split("?")[0]));
              }
              const children = webpackModule.modules;
              if (children) for (const child of children) collect(child);
            }
            for (const chunk of compilation.chunks) {
              for (const webpackModule of compilation.chunkGraph.getChunkModulesIterable(chunk)) {
                collect(webpackModule);
              }
            }
            mkdirSync(".next/third-party", { recursive: true });
            const target = isServer ? nextRuntime ?? "nodejs" : "client";
            writeFileSync(`.next/third-party/${target}.json`, JSON.stringify([...resources].sort()));
          });
        },
      });
    }
    return config;
  },
  async headers() {
    return [
      {
        headers: [
          {
            key: "Referrer-Policy",
            value: "no-referrer",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
        source: "/:path*",
      },
    ];
  },
  reactStrictMode: true,
};

export default nextConfig;
