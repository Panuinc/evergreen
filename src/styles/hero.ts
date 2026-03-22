const { heroui } = require("@heroui/theme");

// ── Retro Okinawa Japan ──────────────────────────────────────────
// Primary  : Ryukyu coral / hibiscus  #C8583C
// Secondary: Okinawan ocean teal      #2A9A92
// Accent   : Sunset amber             #E09030
// BG       : Vintage warm cream       #F5EDE0
// ─────────────────────────────────────────────────────────────────

module.exports = heroui({
  themes: {
    light: {
      colors: {
        background: "#F5EDE0",
        foreground: "#2E1E12",
        primary: {
          50:  "#fdf3ee",
          100: "#fbe3d4",
          200: "#f8c9ac",
          300: "#f2a67c",
          400: "#e87c54",
          500: "#C8583C",
          600: "#B04A30",
          700: "#943E28",
          800: "#7A3422",
          900: "#67301E",
          DEFAULT: "#C8583C",
          foreground: "#F5EDE0",
        },
        secondary: {
          50:  "#edfaf9",
          100: "#d0f3f1",
          200: "#a4e8e4",
          300: "#6dd6d1",
          400: "#3cbdb8",
          500: "#2A9A92",
          600: "#237e78",
          700: "#1e6662",
          800: "#1a5250",
          900: "#184442",
          DEFAULT: "#2A9A92",
          foreground: "#F5EDE0",
        },
        danger: {
          DEFAULT: "#C44030",
          foreground: "#F5EDE0",
        },
        warning: {
          DEFAULT: "#E09030",
          foreground: "#2E1E12",
        },
        success: {
          DEFAULT: "#3A9E6A",
          foreground: "#F5EDE0",
        },
        default: {
          DEFAULT: "#D4C2A8",
          100: "#F5EDE0",
          200: "#E8DBCA",
          300: "#D4C2A8",
          400: "#B8A080",
          500: "#9A8060",
          600: "#7A6448",
          700: "#5E4C34",
          800: "#443826",
          900: "#2E2018",
        },
        divider: "#C8B49A",
        content1: "#FBF3E8",
        content2: "#F5EDE0",
        content3: "#EDE0CE",
        content4: "#E4D4BE",
        focus: "#C8583C",
      },
    },
    dark: {
      colors: {
        background: "#1C140E",
        foreground: "#F0E4D4",
        primary: {
          50:  "#201208",
          100: "#38200E",
          200: "#5A3018",
          300: "#8A4828",
          400: "#C46040",
          500: "#D9724F",
          600: "#E48A68",
          700: "#EDA084",
          800: "#F4B9A4",
          900: "#FAD8CC",
          DEFAULT: "#D9724F",
          foreground: "#1C140E",
        },
        secondary: {
          50:  "#0C1E1E",
          100: "#143030",
          200: "#1E4A48",
          300: "#286860",
          400: "#2A9A92",
          500: "#32B8B0",
          600: "#52CAC2",
          700: "#78D8D2",
          800: "#A4E6E2",
          900: "#D0F4F2",
          DEFAULT: "#32B8B0",
          foreground: "#1C140E",
        },
        danger: {
          DEFAULT: "#D95C4A",
          foreground: "#F0E4D4",
        },
        warning: {
          DEFAULT: "#F0B848",
          foreground: "#1C140E",
        },
        success: {
          DEFAULT: "#4AB87A",
          foreground: "#1C140E",
        },
        default: {
          DEFAULT: "#3C2A1C",
          100: "#241A12",
          200: "#2E2018",
          300: "#3C2A1C",
          400: "#5A4030",
          500: "#7A6048",
          600: "#A08060",
          700: "#C4A882",
          800: "#DCC8A8",
          900: "#F0E4D4",
        },
        divider: "#4A3424",
        content1: "#241A12",
        content2: "#2E2018",
        content3: "#3C2A1C",
        content4: "#4A3830",
        focus: "#D9724F",
      },
    },
  },
});
