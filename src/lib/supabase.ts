import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types
export interface SensorDataRow {
  id_node: string
  waktu: string
  temperature: number
  humidity: number
  pressure: number
  moisture: number
  rain: number
  created_at?: string
  updated_at?: string
}
