import { useState } from "react";
import { useVideoGenerator } from "./hooks/useVideoGenerator";

export function App() {
  const [length, setLength] = useState(5);
  const { isGenerating, generate } = useVideoGenerator();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans text-gray-900">
      <div className="bg-white p-8 w-full max-w-md border border-gray-200 shadow-sm">
        <h1 className="text-2xl font-bold mb-6 tracking-tight">
          Make Countdown
        </h1>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">
              Duration (seconds)
            </label>
            <div className="flex items-center border border-gray-300 focus-within:border-black transition-colors bg-white">
              <input
                type="number"
                pattern="[0-9]*"
                min={0}
                max={6000}
                value={length}
                onInput={(e) => setLength(Number(e.currentTarget.value))}
                className="w-full p-3 outline-none bg-transparent placeholder-gray-400"
                placeholder="Enter seconds"
              />
            </div>
          </div>

          <button
            onClick={() => generate(length)}
            disabled={isGenerating}
            className="w-full bg-black text-white font-medium py-3 px-4 hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? "Generating..." : "Generate Video"}
          </button>
        </div>
      </div>
    </div>
  );
}
