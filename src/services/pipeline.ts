import { Context, Effect, Array } from "effect";
import {
  VideoEncoderService,
  VideoEncoderConfig,
  VideoEncoderInit,
} from "./video_encoder";
import { MediaMuxerService, MuxerConfig } from "./media_muxer";
import { VideoFrameService, VideoFrameConfig } from "./video_frame";
import { ArrayBufferTarget } from "mp4-muxer";

export const formatTime = (seconds: number, totalLength: number) => {
  if (totalLength < 60) return seconds.toFixed(0);
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
};

export const draw = (
  canvas: OffscreenCanvas,
  text: string,
  config: RenderConfigShape
) =>
  Effect.sync(() => {
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Failed to get 2d context");

    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, config.width, config.height);

    ctx.fillStyle = config.textColor;
    ctx.font = "bold 400px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, config.width / 2, config.height / 2);
  });

export interface RenderConfigShape {
  readonly width: number;
  readonly height: number;
  readonly length: number;
  readonly framerate: number;
  readonly bitrate: number;
  readonly backgroundColor: string;
  readonly textColor: string;
}

export class RenderConfig extends Context.Tag("RenderConfig")<
  RenderConfig,
  RenderConfigShape
>() {}

const producer = (config: RenderConfigShape) =>
  Effect.gen(function* () {
    const { width, height, length, framerate, bitrate } = config;
    const totalFrames = Math.ceil(length * framerate);
    const totalSeconds = Math.ceil(length);
    const canvas = new OffscreenCanvas(width, height);
    const keyframeInterval = framerate * 2;
    const frameDuration = (1 / framerate) * 1_000_000;

    const target = new ArrayBufferTarget();

    yield* Effect.gen(function* () {
      const videoMuxer = yield* MediaMuxerService.pipe(
        Effect.provideService(MuxerConfig, {
          target,
          video: { codec: "avc", width, height },
          fastStart: "in-memory",
        })
      );

      const videoEncoder = yield* VideoEncoderService.pipe(
        Effect.provideService(VideoEncoderInit, {
          output: (chunk, meta) => videoMuxer.addVideoChunk(chunk, meta),
          error: console.error,
        }),
        Effect.provideService(VideoEncoderConfig, {
          codec: "avc1.42001f",
          width,
          height,
          bitrate,
          framerate,
        })
      );

      const encodeFrame = (frameIndex: number) =>
        VideoFrameService.pipe(
          Effect.provideService(VideoFrameConfig, {
            source: canvas,
            init: {
              timestamp: (frameIndex / framerate) * 1_000_000,
              duration: frameDuration,
            },
          }),
          Effect.tap((frame: VideoFrame) =>
            Effect.sync(() =>
              videoEncoder.encode(frame, {
                keyFrame: frameIndex % keyframeInterval === 0,
              })
            )
          ),
          Effect.scoped
        );

      const waitForEncoder = Effect.suspend(() =>
        videoEncoder.encodeQueueSize > 5
          ? Effect.sleep("10 millis")
          : Effect.void
      );

      yield* Effect.forEach(
        Array.range(0, totalSeconds),
        (second) =>
          Effect.gen(function* () {
            const timeLeft = formatTime(Math.max(0, length - second), length);
            yield* draw(canvas, timeLeft, config);

            const start = second * framerate;
            const end = Math.min(start + framerate, totalFrames);

            yield* Effect.forEach(
              Array.range(start, end - 1),
              (frameIndex) =>
                waitForEncoder.pipe(Effect.andThen(encodeFrame(frameIndex))),
              { discard: true }
            );
          }),
        { discard: true }
      );

      yield* draw(canvas, formatTime(0, length), config);
      yield* waitForEncoder.pipe(Effect.andThen(encodeFrame(totalFrames)));
    }).pipe(Effect.scoped);

    return target.buffer;
  });

export const render = Effect.gen(function* () {
  const config = yield* RenderConfig;
  return yield* producer(config);
});
