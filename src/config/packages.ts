export const HASHRATE_OPTIONS = [120, 300, 500] as const
export const DURATION_OPTIONS = [1, 3, 5] as const

export type HashrateOption = (typeof HASHRATE_OPTIONS)[number]
export type DurationOption = (typeof DURATION_OPTIONS)[number]

export const PACKAGE_PRICES: Record<HashrateOption, Record<DurationOption, number>> = {
  120: { 1: 12.00, 3: 30.00, 5: 45.00 },
  300: { 1: 28.00, 3: 72.00, 5: 105.00 },
  500: { 1: 45.00, 3: 115.00, 5: 170.00 },
}

export function getPackagePrice(hashrate: HashrateOption, duration: DurationOption): number {
  return PACKAGE_PRICES[hashrate][duration]
}

export function formatHashrate(th: number): string {
  return `${th} TH/s`
}

export function formatDuration(days: number): string {
  return days === 1 ? '1 Tag' : `${days} Tage`
}
