export type PriceObservation = {
  pricePerM3: number;
  completedAt: Date;
};

export type MonthlyPricePoint = {
  month: string;
  sampleSize: number;
  average: number;
  median: number;
  minimum: number;
  maximum: number;
  changePercent: number | null;
};

function round(value: number, digits = 2) {
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

export function buildVerifiedPriceIndex(
  observations: PriceObservation[],
  minimumPublicSample = 3
): MonthlyPricePoint[] {
  const groups = new Map<string, number[]>();

  for (const observation of observations) {
    if (!Number.isFinite(observation.pricePerM3) || observation.pricePerM3 <= 0) continue;
    const month = observation.completedAt.toISOString().slice(0, 7);
    const prices = groups.get(month) ?? [];
    prices.push(observation.pricePerM3);
    groups.set(month, prices);
  }

  const points = [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([, prices]) => prices.length >= minimumPublicSample)
    .map(([month, prices]) => {
      const sorted = [...prices].sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      const median =
        sorted.length % 2 === 0
          ? (sorted[middle - 1] + sorted[middle]) / 2
          : sorted[middle];
      return {
        month,
        sampleSize: sorted.length,
        average: round(sorted.reduce((sum, value) => sum + value, 0) / sorted.length),
        median: round(median),
        minimum: round(sorted[0]),
        maximum: round(sorted[sorted.length - 1]),
        changePercent: null,
      };
    });

  return points.map((point, index) => {
    const previous = points[index - 1];
    return {
      ...point,
      changePercent:
        previous && previous.average > 0
          ? round(((point.average - previous.average) / previous.average) * 100, 1)
          : null,
    };
  });
}
