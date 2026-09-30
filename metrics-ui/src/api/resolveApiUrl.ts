/** Prefix for metrics API paths (respects Vite `base`, e.g. `/usage/` on the lab host). */
export function resolveApiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path.slice(1) : path
  return `${import.meta.env.BASE_URL}${normalized}`
}

export function useLiveMetricsApi(): boolean {
  return import.meta.env.MODE === 'live' || import.meta.env.PROD
}
