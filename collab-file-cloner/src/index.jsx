import React from "react";
//import ReactDOM from "react-dom";
import { createRoot } from 'react-dom/client';
import "./index.css";
import initAuth from "./auth";
import { ContextMainProvider } from "./ContextMain";
import App from "./App";

function renderApp(auth) {
  //console.log(auth);
  const root = createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <ContextMainProvider>
        <App token={auth.token} />
      </ContextMainProvider>
    </React.StrictMode>
  );
}


// In development, if VITE_DEV_TOKEN is set in .env.local, use it directly.
// Otherwise fall through to the normal Keycloak login flow.
// See .env.local.example for setup instructions.
if (import.meta.env.DEV && import.meta.env.VITE_DEV_TOKEN) {
  window.addEventListener("DOMContentLoaded", () => renderApp({ token: import.meta.env.VITE_DEV_TOKEN }));
} else {
  window.addEventListener('DOMContentLoaded', () => initAuth(renderApp));
}
