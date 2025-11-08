// Shared chart utilities for canvas renderers
export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

export function computeScale(domainMin: number, domainMax: number, rangeMin: number, rangeMax: number) {
  const domainRange = domainMax - domainMin || 1;
  const scale = (v: number) => rangeMin + ((v - domainMin) / domainRange) * (rangeMax - rangeMin);
  return scale;
}

export function sampleData(data: any[], maxPoints = 1000) {
  const step = Math.max(1, Math.floor(data.length / maxPoints));
  const out = [] as any[];
  for (let i = 0; i < data.length; i += step) out.push(data[i]);
  return out;
}
