import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./lib/i18n"; // Import i18n configuration

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

createRoot(rootElement).render(<App />);
