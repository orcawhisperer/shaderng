export interface AudioVolumes {
  input: number;
  output: number;
}

/**
 * Anything an orb can listen to.
 *
 * - `"microphone"` asks for `getUserMedia` and owns the tracks (stopped on dispose).
 * - `MediaStream`: a WebRTC remote track, a `captureStream()`, or a mic stream you already
 *   hold. Tracks are left running on dispose because the caller owns them.
 * - `AudioNode`: tap an existing Web Audio graph (a TTS `AudioBufferSourceNode`, a `GainNode`
 *   before your speakers). Its `AudioContext` is reused and never closed here.
 * - `HTMLMediaElement`: an `<audio>` or `<video>`. Uses `captureStream()` where available so
 *   playback is untouched; otherwise falls back to `createMediaElementSource`, which reroutes
 *   the element's output through the analyser and back to the speakers.
 */
export type OrbAudioSource = "microphone" | MediaStream | AudioNode | HTMLMediaElement;

export const rmsFromTimeDomain = (samples: Uint8Array): number => {
  let sum = 0;
  for (const sample of samples) {
    const centered = (sample - 128) / 128;
    sum += centered * centered;
  }
  return Math.sqrt(sum / Math.max(samples.length, 1));
};

export const envelopeStep = (previous: number, rms: number): number => {
  const incoming = Math.min(1, rms * 3.4);
  const rate = incoming > previous ? 0.5 : 0.14;
  return previous + (incoming - previous) * rate;
};

interface Tap {
  readonly context: BaseAudioContext;
  readonly node: AudioNode;
  readonly dispose: () => void;
}

const isMediaElement = (value: unknown): value is HTMLMediaElement =>
  typeof HTMLMediaElement !== "undefined" && value instanceof HTMLMediaElement;

const isAudioNode = (value: unknown): value is AudioNode =>
  typeof AudioNode !== "undefined" && value instanceof AudioNode;

const isMediaStream = (value: unknown): value is MediaStream =>
  typeof MediaStream !== "undefined" && value instanceof MediaStream;

const captureStream = (element: HTMLMediaElement): MediaStream | undefined => {
  const capture = element as HTMLMediaElement & {
    captureStream?: () => MediaStream;
    mozCaptureStream?: () => MediaStream;
  };
  try {
    return capture.captureStream?.() ?? capture.mozCaptureStream?.();
  } catch {
    // Cross-origin media without CORS throws SecurityError; fall back below.
    return undefined;
  }
};

const openTap = async (source: OrbAudioSource): Promise<Tap> => {
  if (source === "microphone") {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error("Microphone access is not available in this browser.");
    }
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true },
      video: false,
    });
    const context = new AudioContext();
    const node = context.createMediaStreamSource(stream);
    return {
      context,
      node,
      dispose: () => {
        node.disconnect();
        void context.close();
        for (const track of stream.getTracks()) {
          track.stop();
        }
      },
    };
  }

  if (isMediaStream(source)) {
    if (source.getAudioTracks().length === 0) {
      throw new Error("The MediaStream has no audio track.");
    }
    const context = new AudioContext();
    const node = context.createMediaStreamSource(source);
    return {
      context,
      node,
      dispose: () => {
        node.disconnect();
        void context.close();
      },
    };
  }

  if (isAudioNode(source)) {
    return { context: source.context, node: source, dispose: () => undefined };
  }

  if (isMediaElement(source)) {
    const stream = captureStream(source);
    if (stream) {
      const context = new AudioContext();
      const node = context.createMediaStreamSource(stream);
      return {
        context,
        node,
        dispose: () => {
          node.disconnect();
          void context.close();
        },
      };
    }
    // createMediaElementSource takes over the element's output, so route it back to the
    // speakers. A second call on the same element throws; there is no way around that.
    const context = new AudioContext();
    const node = context.createMediaElementSource(source);
    node.connect(context.destination);
    return {
      context,
      node,
      dispose: () => {
        node.disconnect();
        void context.close();
      },
    };
  }

  throw new Error(
    "Unsupported audio source. Pass 'microphone', a MediaStream, AudioNode, or media element.",
  );
};

/**
 * Measures `source` once per animation frame and reports `{ input, output }` volumes in
 * `[0, 1]`: `input` is the raw RMS, `output` is an attack/release envelope of it. The
 * returned function stops the loop and releases whatever this call created.
 */
export const startAudioDrive = async (
  source: OrbAudioSource,
  onFrame: (volumes: AudioVolumes) => void,
): Promise<() => void> => {
  const tap = await openTap(source);
  const analyser = tap.context.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.35;
  tap.node.connect(analyser);

  const samples = new Uint8Array(analyser.fftSize);
  let smooth = 0;
  let frame = 0;
  let stopped = false;

  const tick = () => {
    if (stopped) {
      return;
    }
    analyser.getByteTimeDomainData(samples);
    const rms = rmsFromTimeDomain(samples);
    const input = Math.min(1, rms * 3.4);
    smooth = envelopeStep(smooth, rms);
    onFrame({ input, output: smooth });
    frame = requestAnimationFrame(tick);
  };

  if (tap.context instanceof AudioContext && tap.context.state === "suspended") {
    try {
      await tap.context.resume();
    } catch {
      // Autoplay policy: the context resumes on the next user gesture; keep measuring anyway.
    }
  }
  frame = requestAnimationFrame(tick);

  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
    try {
      tap.node.disconnect(analyser);
    } catch {
      // Already disconnected by the owner of the node.
    }
    tap.dispose();
  };
};
