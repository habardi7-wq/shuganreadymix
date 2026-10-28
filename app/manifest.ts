import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "خرسانة برو",
    short_name: "خرسانة برو",
    description: "منصة طلب ومقارنة ومتابعة توريد الخرسانة الجاهزة",
    start_url: "/ar?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#f7f7f5",
    theme_color: "#f58206",
    lang: "ar",
    dir: "rtl",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/shugan/logo.png",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/shugan/logo.png",
        sizes: "any",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
