import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { SimulatorProvider } from "./context/SimulatorContext";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SimulatorProvider>
      <App />
    </SimulatorProvider>
  </React.StrictMode>
);
