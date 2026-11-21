import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/manrope";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/fraunces";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
