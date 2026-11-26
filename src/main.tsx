import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/manrope";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/fraunces";
import "./index.css";
import { registerSW } from "virtual:pwa-register";
import { initPwa } from "./lib/pwa";
import { initInstallCapture } from "./lib/install";

initInstallCapture();
// The service worker only runs in the production build, never in `npm run dev`.
if (import.meta.env.PROD) initPwa(registerSW);

createRoot(document.getElementById("root")!).render(<App />);