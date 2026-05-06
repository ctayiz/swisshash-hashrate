import type { Database } from './database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Package = Database['public']['Tables']['packages']['Row']
export type PoolConfig = Database['public']['Tables']['customer_pool_configs']['Row']
export type Order = Database['public']['Tables']['orders']['Row']
export type OrderEvent = Database['public']['Tables']['order_events']['Row']
export type ProxyConfigVersion = Database['public']['Tables']['proxy_config_versions']['Row']

export type OrderStatus = Order['status']
export type UserRole = Profile['role']
export type TriggerSource = ProxyConfigVersion['trigger_source']

export interface OrderWithPackage extends Order {
  package: Package
  pool_config: PoolConfig | null
  customer: Profile
}

export interface OrderWithDetails extends Order {
  package: Package
  pool_config: PoolConfig | null
  events: OrderEvent[]
}

export interface ActiveOrderForProxy {
  id: string
  hashrate_th: number
  pool_config: {
    pool_url: string
    pool_port: number
    worker_name: string
    password: string
    tls: boolean
  } | null
  customer_email: string
}

export interface RebuildResult {
  version: number
  yaml: string
  total_hashrate_th: number
  active_order_count: number
  generated_at: string
}
