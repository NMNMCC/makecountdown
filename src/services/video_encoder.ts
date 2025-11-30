import { Context, Effect } from "effect";
import { Muxer } from "mp4-muxer";

export class VideoEncoderInit extends Context.Tag("VideoEncoderInit")<
  VideoEncoderInit,
  globalThis.VideoEncoderInit
>() {}
export class VideoEncoderConfig extends Context.Tag("VideoEncoderConfig")<
  VideoEncoderConfig,
  globalThis.VideoEncoderConfig
>() {}

export const VideoEncoderService = Effect.acquireRelease(
  Effect.gen(function* () {
    const encoder = new VideoEncoder(yield* VideoEncoderInit);
    encoder.configure(yield* VideoEncoderConfig);
    return encoder;
  }),
  (encoder) => Effect.promise(() => encoder.flush().then(() => encoder.close()))
);
