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


// For local development, uncomment the lines below, paste in a valid token, then comment out the bottom line
// const auth = {
//     token: "eyJ..."
// }
// window.addEventListener('DOMContentLoaded', () => renderApp(auth));
window.addEventListener('DOMContentLoaded', () => initAuth(renderApp));
