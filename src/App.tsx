import { useState, useEffect } from "react";
import QRGenerator from "./components/QRGenerator";

function App() {
  const [dark, setDark] = useState(() => {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <button
        className="btn btn-circle btn-ghost fixed top-4 right-4 text-xl z-10"
        onClick={() => setDark((d) => !d)}
        aria-label="Toggle theme"
      >
        {dark ? "☀️" : "🌙"}
      </button>
      <QRGenerator />
    </main>
  );
}

export default App;
