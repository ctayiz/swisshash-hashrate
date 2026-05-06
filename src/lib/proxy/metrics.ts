export interface ProxyMetrics {
  uptime_secs: number
  downstream: {
    conn_count: number
    accepted: number
    rejected: number
    stale: number
    avg_diff: number
    hr_1min: number
  }
  upstream: {
    conn_count: number
    accepted: number
    rejected: number
    stale: number
    hr_1min: number
  }
  aggregation_ratio: number
  active_pool: string | null
  version: string | null
}

function extractValue(lines: string[], key: string, stream?: string): number {
  for (const line of lines) {
    if (!line.startsWith(key)) continue
    if (stream && !line.includes(`stream="${stream}"`)) continue
    const parts = line.split(' ')
    const val = parseFloat(parts[parts.length - 1])
    return isNaN(val) ? 0 : val
  }
  return 0
}

function extractLabel(lines: string[], key: string, label: string): string | null {
  for (const line of lines) {
    if (!line.startsWith(key)) continue
    const match = line.match(new RegExp(`${label}="([^"]+)"`))
    return match ? match[1] : null
  }
  return null
}

export function parseMetrics(raw: string): ProxyMetrics {
  const lines = raw.trim().split('\n').map(l => l.trim()).filter(Boolean)

  return {
    uptime_secs: extractValue(lines, 'uptime_secs'),
    downstream: {
      conn_count:  extractValue(lines, 'conn_count',  'downstream'),
      accepted:    extractValue(lines, 'accepted',    'downstream'),
      rejected:    extractValue(lines, 'rejected',    'downstream'),
      stale:       extractValue(lines, 'stale',       'downstream'),
      avg_diff:    extractValue(lines, 'avg_diff',    'downstream'),
      hr_1min:     extractValue(lines, 'hr_1min',     'downstream'),
    },
    upstream: {
      conn_count:  extractValue(lines, 'conn_count',  'upstream'),
      accepted:    extractValue(lines, 'accepted',    'upstream'),
      rejected:    extractValue(lines, 'rejected',    'upstream'),
      stale:       extractValue(lines, 'stale',       'upstream'),
      hr_1min:     extractValue(lines, 'hr_1min',     'upstream'),
    },
    aggregation_ratio: extractValue(lines, 'aggregation_ratio'),
    active_pool:       extractLabel(lines, 'pool{', 'url'),
    version:           extractLabel(lines, 'release{', 'version'),
  }
}

export function formatHashrate(ghPerSec: number): string {
  if (ghPerSec >= 1000) return `${(ghPerSec / 1000).toFixed(2)} TH/s`
  if (ghPerSec >= 1)    return `${ghPerSec.toFixed(0)} GH/s`
  return `${(ghPerSec * 1000).toFixed(0)} MH/s`
}

export function formatUptime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export async function fetchProxyMetrics(): Promise<ProxyMetrics | null> {
  const agentUrl    = process.env.PROXY_AGENT_URL
  const agentSecret = process.env.PROXY_AGENT_SECRET
  if (!agentUrl || !agentSecret) return null

  try {
    const res = await fetch(`${agentUrl}/metrics`, {
      headers: { Authorization: `Bearer ${agentSecret}` },
      next: { revalidate: 0 },
    })
    if (!res.ok) return null
    const raw = await res.text()
    return parseMetrics(raw)
  } catch {
    return null
  }
}
