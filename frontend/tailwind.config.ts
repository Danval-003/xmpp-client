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
        "custom-gradient": "linear-gradient(to right, #019587, #005148);",
        "login-gradient": "linear-gradient(to right, #ffb347, #ffcc33);",
        "chat-gradient": "linear-gradient(90deg, #F2D2B6 0%, #F2A663 100%);",
      },
      fontFamily: {
        aggro: ['Aggro', 'sans-serif'],
      },
      textShadow: {
        'default': '2px 2px 4px #f8f8f8',
        'lg': '3px 3px 6px #f8f8f8',
        'xl': '4px 4px 8px #f8f8f8',
        '2xl': '5px 5px 10px #f8f8f8',
        'none': 'none',
      }
      
    },
  },
  plugins: [],
};
export default config;
