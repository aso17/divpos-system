import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ProjectProvider } from "./context/ProjectContext";
import { AuthProvider } from "./context/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ProjectProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ProjectProvider>
  </React.StrictMode>
);
