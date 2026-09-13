import { envelopeStep, rmsFromTimeDomain } from "./mic-drive";

describe("mic drive", () => {
  it("treats a silent buffer as near-zero RMS", () => {
    const samples = Uint8Array.from({ length: 32 }, () => 128);
    expect(rmsFromTimeDomain(samples)).toBeCloseTo(0, 5);
  });

  it("eases the envelope up faster than down", () => {
    const attack = envelopeStep(0, 0.4);
    const release = envelopeStep(1, 0);
    expect(attack).toBeGreaterThan(0.4);
    expect(release).toBeLessThan(0.9);
  });
});
