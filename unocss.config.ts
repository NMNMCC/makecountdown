import { defineConfig } from "unocss/vite";
import { presetWind4, presetTypography } from "unocss";

export default defineConfig({
  presets: [presetWind4(), presetTypography()],
});
