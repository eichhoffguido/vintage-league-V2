import { createRoot } from "react-dom/client";
import App from "./App.tsx";
// Schriften selbst gehostet (DSGVO: kein Google-Fonts-CDN) — siehe Skill cc-design
import "@fontsource/jost/500.css";
import "@fontsource/jost/600.css";
import "@fontsource/jost/700.css";
import "@fontsource/archivo-narrow/400.css";
import "@fontsource/archivo-narrow/500.css";
import "@fontsource/archivo-narrow/600.css";
import "@fontsource/barlow-condensed/500.css";
import "@fontsource/barlow-condensed/600.css";
import "@fontsource/barlow-condensed/700.css";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
