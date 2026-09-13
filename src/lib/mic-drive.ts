export interface MicVolumes {
  input: number;
  output: number;
}

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

export const startMicDrive = async (
  onFrame: (volumes: MicVolumes) => void,
): Promise<() => void> => {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("Microphone access is not available in this browser.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true },
    video: false,
  });
  const context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  const analyser = context.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = 0.35;
  source.connect(analyser);

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

  if (context.state === "suspended") {
    await context.resume();
  }
  frame = requestAnimationFrame(tick);

  return () => {
    stopped = true;
    cancelAnimationFrame(frame);
    source.disconnect();
    void context.close();
    for (const track of stream.getTracks()) {
      track.stop();
    }
  };
};
