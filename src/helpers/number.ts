export function clamp(min: number, max: number) {
  return Math.min(Math.max(max, min), max);
}

export function round(number: number, decimalPlaces: number = 8) {
  return Number(Math.round(Number(`${number}e${decimalPlaces}`)) + `e-${decimalPlaces}`);
}
