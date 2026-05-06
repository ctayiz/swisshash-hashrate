export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'customer' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'customer' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'customer' | 'admin'
          updated_at?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          id: string
          name: string
          hashrate_th: number
          duration_days: number
          price_usd: number
          is_active: boolean
          stripe_price_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          hashrate_th: number
          duration_days: number
          price_usd: number
          is_active?: boolean
          stripe_price_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          hashrate_th?: number
          duration_days?: number
          price_usd?: number
          is_active?: boolean
          stripe_price_id?: string | null
        }
        Relationships: []
      }
      customer_pool_configs: {
        Row: {
          id: string
          user_id: string
          name: string
          pool_url: string
          pool_port: number
          worker_name: string
          password: string
          tls: boolean
          is_default: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          pool_url: string
          pool_port?: number
          worker_name: string
          password?: string
          tls?: boolean
          is_default?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          pool_url?: string
          pool_port?: number
          worker_name?: string
          password?: string
          tls?: boolean
          is_default?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'customer_pool_configs_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      orders: {
        Row: {
          id: string
          customer_id: string
          package_id: string
          pool_config_id: string | null
          hashrate_th: number
          duration_days: number
          price_usd: number
          status: 'pending' | 'active' | 'paused' | 'expired' | 'cancelled'
          activated_at: string | null
          expires_at: string | null
          paused_at: string | null
          remaining_seconds: number | null
          activated_by: string | null
          stripe_session_id: string | null
          stripe_payment_intent: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          package_id: string
          pool_config_id?: string | null
          hashrate_th: number
          duration_days: number
          price_usd: number
          status?: 'pending' | 'active' | 'paused' | 'expired' | 'cancelled'
          activated_at?: string | null
          expires_at?: string | null
          paused_at?: string | null
          remaining_seconds?: number | null
          activated_by?: string | null
          stripe_session_id?: string | null
          stripe_payment_intent?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          pool_config_id?: string | null
          status?: 'pending' | 'active' | 'paused' | 'expired' | 'cancelled'
          activated_at?: string | null
          expires_at?: string | null
          paused_at?: string | null
          remaining_seconds?: number | null
          activated_by?: string | null
          stripe_session_id?: string | null
          stripe_payment_intent?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'orders_customer_id_fkey'
            columns: ['customer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_package_id_fkey'
            columns: ['package_id']
            isOneToOne: false
            referencedRelation: 'packages'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_pool_config_id_fkey'
            columns: ['pool_config_id']
            isOneToOne: false
            referencedRelation: 'customer_pool_configs'
            referencedColumns: ['id']
          }
        ]
      }
      order_events: {
        Row: {
          id: string
          order_id: string
          event_type: 'created' | 'activated' | 'expired' | 'cancelled' | 'noted' | 'payment_received' | 'paused' | 'resumed' | 'reactivated'
          actor_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          event_type: 'created' | 'activated' | 'expired' | 'cancelled' | 'noted' | 'payment_received' | 'paused' | 'resumed' | 'reactivated'
          actor_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'order_events_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          }
        ]
      }
      proxy_config_versions: {
        Row: {
          id: string
          version: number
          yaml_content: string
          total_hashrate_th: number
          active_order_count: number
          trigger_source: 'order_activated' | 'order_expired' | 'order_cancelled' | 'order_paused' | 'order_resumed' | 'order_reactivated' | 'manual' | 'cron' | 'empty_fallback'
          trigger_order_id: string | null
          generated_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          version: number
          yaml_content: string
          total_hashrate_th?: number
          active_order_count?: number
          trigger_source: 'order_activated' | 'order_expired' | 'order_cancelled' | 'order_paused' | 'order_resumed' | 'order_reactivated' | 'manual' | 'cron' | 'empty_fallback'
          trigger_order_id?: string | null
          generated_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      is_admin: {
        Args: Record<string, never>
        Returns: boolean
      }
      custom_access_token_hook: {
        Args: { event: Json }
        Returns: Json
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
