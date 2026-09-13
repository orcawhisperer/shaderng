import { type AudioVolumes, startAudioDrive } from "@/lib/audio-drive";

export { envelopeStep, rmsFromTimeDomain } from "@/lib/audio-drive";
export type MicVolumes = AudioVolumes;

/** `startAudioDrive("microphone", onFrame)`; kept for code written against the first release. */
export const startMicDrive = (onFrame: (volumes: MicVolumes) => void): Promise<() => void> =>
  startAudioDrive("microphone", onFrame);
