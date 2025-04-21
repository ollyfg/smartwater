import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./style.css";
import { SqlProvider } from "./contexts/sqlite";

ReactDOM.createRoot(document.getElementById("app")!).render(
  <React.StrictMode>
    <SqlProvider>
      <App />
    </SqlProvider>
  </React.StrictMode>
);
