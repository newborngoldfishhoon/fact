export type Database = {
  public: {
    Tables: {
      claim_history: {
        Row: {
          id: string
          user_id: string
          claim: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          claim: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          claim?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type ClaimHistoryItem =
  Database['public']['Tables']['claim_history']['Row']
