import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App"; // Ensure App is a valid component

const root = createRoot(document.getElementById("root"));
root.render(<App />);

export default App;
