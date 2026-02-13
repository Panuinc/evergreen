const { heroui } = require("@heroui/theme");

module.exports = heroui({
  themes: {
    light: {
      colors: { background: "#FCFCFC", foreground: "#171717" },
    },
    dark: {
      colors: { background: "#171717", foreground: "#FCFCFC" },
    },
  },
});
