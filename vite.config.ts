import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";
import viteCompression from "vite-plugin-compression";

/**
 * OneKlick live-chat widget embed. Injected only when both env vars are set,
 * so the tag's presence, API host and token are per-Netlify-context config
 * (netlify.toml), not code: production → api.oneklickai.net + store 1's prod
 * token; deploy previews → dev-api + the dev-mirror token. Unset → no widget
 * (and App.tsx keeps Tawk.to as the fallback). Colours match the site's
 * black-and-gold palette; ChatPortal's brand colour, when set, wins.
 */
function oneklickChatWidget(env: Record<string, string>): Plugin {
  const src = env.VITE_ONEKLICK_WIDGET_SRC;
  const token = env.VITE_ONEKLICK_WIDGET_TOKEN;
  return {
    name: "oneklick-chat-widget",
    transformIndexHtml() {
      if (!src || !token) return [];
      return [
        {
          tag: "script",
          attrs: {
            src,
            "data-token": token,
            "data-brand-color": "#1A1A1A",
            "data-accent-color": "#EED26E",
            async: true,
          },
          injectTo: "body",
        },
      ];
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    oneklickChatWidget(loadEnv(mode, process.cwd(), "VITE_")),
    react(),
    svgr(),
    // Emit .gz and .br alongside .js/.css/.html so Netlify can serve compressed.
    viteCompression({ algorithm: "gzip", ext: ".gz", threshold: 1024, deleteOriginFile: false }),
    viteCompression({ algorithm: "brotliCompress", ext: ".br", threshold: 1024, deleteOriginFile: false }),
  ],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  server: {
    fs: { strict: false },
  },
  build: {
    target: "es2020",
    cssMinify: "esbuild",
    sourcemap: false,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // Split vendor chunks so visitors only re-download what changed between deploys.
        manualChunks: (id) => {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react-router") || id.includes("@remix-run")) return "router";
          if (id.includes("@mui/icons-material")) return "mui-icons";
          if (id.includes("@mui/material") || id.includes("@mui/system") || id.includes("@mui/lab") || id.includes("@mui/x-date-pickers")) return "mui";
          if (id.includes("@emotion")) return "emotion";
          if (id.includes("dayjs")) return "dayjs";
          if (id.includes("react-material-ui-carousel")) return "carousel";
          if (id.includes("react-icons") || id.includes("lucide-react")) return "icons";
          if (id.includes("react-helmet-async") || id.includes("react-fast-compare") || id.includes("invariant") || id.includes("shallowequal")) return "helmet";
          if (id.includes("/react/") || id.includes("/react-dom/") || id.includes("/scheduler/")) return "react";
          return "vendor";
        },
      },
    },
  },
}));
