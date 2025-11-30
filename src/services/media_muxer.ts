import { Context, Effect } from "effect";
import { Muxer } from "mp4-muxer";

export class MuxerConfig extends Context.Tag("MuxerConfig")<
  MuxerConfig,
  ConstructorParameters<typeof Muxer>[0]
>() {}

export const MediaMuxerService = Effect.acquireRelease(
  Effect.gen(function* () {
    return new Muxer(yield* MuxerConfig);
  }),
  (muxer) => Effect.sync(() => muxer.finalize())
);
