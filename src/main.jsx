import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AppStateProvider } from "./context/AppStateContext.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <AppStateProvider>
    <App />
  </AppStateProvider>,
);
