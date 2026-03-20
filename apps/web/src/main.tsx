import React from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { App } from "./App";
import "./index.css";

function isIosStandaloneApp(): boolean {
  const userAgent = window.navigator.userAgent;
  const isIos = /iPhone|iPad|iPod/i.test(userAgent);
  const standaloneNavigator = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    isIos &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      standaloneNavigator.standalone === true)
  );
}

const stored = localStorage.getItem("theme");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
if (stored === "dark" || (!stored && prefersDark)) {
  document.documentElement.classList.add("dark");
}

if (isIosStandaloneApp()) {
  document.documentElement.dataset["iosStandalone"] = "true";
  document.body.dataset["iosStandalone"] = "true";
}

registerSW({ immediate: true });

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
