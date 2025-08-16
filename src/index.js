import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles/global.css";
import { CartProvider } from "./store/CartContext";
import { ThemeProvider } from "./store/ThemeContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
  <ThemeProvider>
    <CartProvider>
      <App />
    </CartProvider>
    </ThemeProvider>
  </BrowserRouter>
);
