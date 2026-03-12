import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";

import App from "./App";
import { StoreProvider } from "./context/StoreContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <App />
        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            style: {
              background: "rgba(6, 12, 24, 0.94)",
              border: "1px solid rgba(96, 119, 255, 0.35)",
              color: "#f7f9ff",
            },
          }}
        />
      </StoreProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
