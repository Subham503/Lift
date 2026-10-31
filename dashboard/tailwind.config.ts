import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas: "#000000",
        surface: {
          1: "#0E0E10",
          2: "#161618",
          3: "#1F1F22",
        },
        border: "rgba(255, 255, 255, 0.08)",
        text: {
          DEFAULT: "#F5F5F7",
          1: "#F5F5F7",
          2: "#8E8E93",
          3: "#636366",
        },
        accent: {
          DEFAULT: "#0A84FF",
          dim: "rgba(10, 132, 255, 0.15)",
        },
        gain: {
          DEFAULT: "#30D158",
          dim: "rgba(48, 209, 88, 0.15)",
        },
        override: {
          DEFAULT: "#FF9F0A",
          dim: "rgba(255, 159, 10, 0.15)",
        },
        loss: {
          DEFAULT: "#FF453A",
          dim: "rgba(255, 69, 58, 0.15)",
        },
      },
      borderRadius: {
        control: "6px",
        card: "10px",
        panel: "14px",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "SF Pro Text",
          "Segoe UI Variable",
          "Inter",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "Cascadia Code",
          "monospace",
        ],
      },
      fontSize: {
        "apple-12": ["12px", { lineHeight: "16px" }],
        "apple-13": ["13px", { lineHeight: "18px" }],
        "apple-15": ["15px", { lineHeight: "20px" }],
        "apple-20": ["20px", { lineHeight: "26px" }],
        "apple-28": ["28px", { lineHeight: "34px" }],
      },
      fontWeight: {
        regular: "400",
        medium: "500",
        semibold: "600",
      },
    },
  },
  plugins: [],
};

export default config;

