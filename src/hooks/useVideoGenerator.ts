import { useState } from "react";
import { Effect } from "effect";
import { RenderConfig, render } from "../services/pipeline";

export function useVideoGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = async (seconds: number) => {
    setIsGenerating(true);

    const program = Effect.gen(function* () {
      return yield* render;
    }).pipe(
      Effect.provideService(RenderConfig, {
        width: 1280,
        height: 720,
        length: seconds,
        framerate: 1,
        bitrate: 100_000,
        backgroundColor: "white",
        textColor: "black",
      })
    );

    try {
      const buffer = await Effect.runPromise(program);
      const blob = new Blob([buffer], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `countdown-${seconds}s.mp4`;
      a.click();
    } catch (error) {
      console.error("Generation failed", error);
      alert("Error generating video: " + String(error));
    } finally {
      setIsGenerating(false);
    }
  };

  return { isGenerating, generate };
}
