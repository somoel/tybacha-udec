/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require("nativewind/preset")],
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        fondo: "#f4f7fb",
        superficie: "#ffffff",
        tinta: "#152230",
        tenue: "#5f6f82",
        linea: "#d6e1ea",
        primario: "#0c8f83",
        "primario-fuerte": "#08645e",
        "primario-suave": "#dff8f3",
        acento: "#ef7c45",
        "acento-suave": "#fff0e8",
        info: "#3d6edb",
        "info-suave": "#eaf0ff",
        exito: "#15945f",
        peligro: "#d73a31",
        advertencia: "#d88912"
      },
      borderRadius: {
        ty: "8px"
      }
    }
  },
  plugins: []
};
