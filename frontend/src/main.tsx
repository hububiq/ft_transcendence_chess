import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/index.css";
import { AuthProvider } from "./features/auth/context/AuthProvider.tsx";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Failed to find the root element. Check index.html.");
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);
