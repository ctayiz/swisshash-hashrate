export interface PoolEntry {
  url: string
  user: string
  pass: string
  tls: boolean
}

export interface PoolGroup {
  group: string
  weight: number
  pools: PoolEntry[]
}

export interface PortConfig {
  bind_port: number
  name: string
  active: boolean
  submission_rate: number
  aggregation: number
  mining_algorithm: string
  pool_groups: PoolGroup[]
}

export interface ProxyConfig {
  log_level: string
  api_port: number
  log_dir: string
  telemetry: null
  upstream_tcp_settings: {
    keep_alive: {
      idle_time: { secs: number; nanos: number }
      interval: { secs: number; nanos: number }
      retries: number
    }
    user_timeout: string
  }
  ports: PortConfig[]
}
