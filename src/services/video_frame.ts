import { Context, Effect } from "effect";

export class VideoFrameConfig extends Context.Tag("FrameConfig")<
  VideoFrameConfig,
  {
    source: CanvasImageSource;
    init?: VideoFrameInit;
  }
>() {}

export const VideoFrameService = Effect.acquireRelease(
  Effect.gen(function* () {
    const { source, init } = yield* VideoFrameConfig;
    return new VideoFrame(source, init);
  }),
  (frame) => Effect.sync(() => frame.close())
);
