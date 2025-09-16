import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// SW is auto-managed via PwaBanner using useRegisterSW

createRoot(document.getElementById("root")!).render(<App />);
