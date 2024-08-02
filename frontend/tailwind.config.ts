import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "custom-gradient": "linear-gradient(to right, #4b6cb7, #182848);",
        "login-gradient": "linear-gradient(to right, #ffb347, #ffcc33);",
        "chat-gradient": "linear-gradient(90deg, hsla(235, 100%, 78%, 1) 0%, hsla(222, 77%, 33%, 1) 100%);",
      },
      fontFamily: {
        aggro: ['Aggro', 'sans-serif'],
      },
      
    },
  },
  plugins: [],
};
export default config;
