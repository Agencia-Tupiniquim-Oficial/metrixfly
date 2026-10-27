import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./index.css";
import { loadGoogleTagManager } from "@/lib/analytics";

loadGoogleTagManager(import.meta.env.VITE_GTM_ID);

createRoot(document.getElementById("root")!).render(<App />);
