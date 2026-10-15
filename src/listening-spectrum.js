// Real Fourier coefficients of Hann-windowed frames. The distributed model
// expects the real RFFT component, rather than an absolute-value spectrogram.
export function realSpectrum(signal, length, step) {
  const frames = Math.floor((signal.length - length) / step) + 1;
  const bins = length / 2 + 1;
  const result = new Float32Array(frames * bins);
  const real = new Float64Array(length), imaginary = new Float64Array(length);
  for (let frame = 0; frame < frames; frame++) {
    imaginary.fill(0);
    for (let i = 0; i < length; i++) real[i] = signal[frame * step + i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / length));
    for (let i = 1, j = 0; i < length; i++) {
      let bit = length >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) [real[i], real[j]] = [real[j], real[i]];
    }
    for (let size = 2; size <= length; size *= 2) {
      const angle = -2 * Math.PI / size;
      for (let start = 0; start < length; start += size) {
        for (let k = 0; k < size / 2; k++) {
          const a = start + k, b = a + size / 2;
          const c = Math.cos(angle * k), d = Math.sin(angle * k);
          const r = real[b] * c - imaginary[b] * d;
          const im = real[b] * d + imaginary[b] * c;
          real[b] = real[a] - r; imaginary[b] = imaginary[a] - im;
          real[a] += r; imaginary[a] += im;
        }
      }
    }
    result.set(real.subarray(0, bins), frame * bins);
  }
  return { result, frames, bins };
}
