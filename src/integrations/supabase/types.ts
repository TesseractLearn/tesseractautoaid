export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      booking_offers: {
        Row: {
          booking_id: string
          created_at: string
          eta_minutes: number | null
          id: string
          mechanic_id: string
          score: number
          status: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          created_at?: string
          eta_minutes?: number | null
          id?: string
          mechanic_id: string
          score?: number
          status?: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          created_at?: string
          eta_minutes?: number | null
          id?: string
          mechanic_id?: string
          score?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_offers_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_offers_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          address: string | null
          completed_at: string | null
          created_at: string
          estimated_price: number | null
          estimated_price_max: number | null
          estimated_price_min: number | null
          final_price: number | null
          id: string
          issue_description: string | null
          latitude: number
          longitude: number
          mechanic_id: string | null
          mechanic_quote: number | null
          payment_status: string | null
          platform_fee: number | null
          priority: string | null
          selected_problems: string[] | null
          service_type: string
          severity: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          completed_at?: string | null
          created_at?: string
          estimated_price?: number | null
          estimated_price_max?: number | null
          estimated_price_min?: number | null
          final_price?: number | null
          id?: string
          issue_description?: string | null
          latitude: number
          longitude: number
          mechanic_id?: string | null
          mechanic_quote?: number | null
          payment_status?: string | null
          platform_fee?: number | null
          priority?: string | null
          selected_problems?: string[] | null
          service_type: string
          severity?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          completed_at?: string | null
          created_at?: string
          estimated_price?: number | null
          estimated_price_max?: number | null
          estimated_price_min?: number | null
          final_price?: number | null
          id?: string
          issue_description?: string | null
          latitude?: number
          longitude?: number
          mechanic_id?: string | null
          mechanic_quote?: number | null
          payment_status?: string | null
          platform_fee?: number | null
          priority?: string | null
          selected_problems?: string[] | null
          service_type?: string
          severity?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          id: string
          mechanic_id: string
          rating: number
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          mechanic_id: string
          rating: number
          user_id: string
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          mechanic_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_reviews_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanic_transactions: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string
          description: string | null
          id: string
          mechanic_id: string
          transaction_type: string
        }
        Insert: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          mechanic_id: string
          transaction_type?: string
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          mechanic_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "mechanic_transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mechanic_transactions_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
      mechanics: {
        Row: {
          active_jobs_count: number | null
          address: string | null
          avg_eta: number | null
          avg_response_time: number | null
          created_at: string
          documents_url: string | null
          experience_years: number | null
          full_name: string
          id: string
          is_available: boolean | null
          is_verified: boolean | null
          latitude: number
          longitude: number
          phone: string | null
          profile_photo_url: string | null
          rating: number | null
          recent_jobs_count: number | null
          services_offered: string[] | null
          specialization: string | null
          total_earnings: number | null
          total_jobs_count: number | null
          total_rating_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active_jobs_count?: number | null
          address?: string | null
          avg_eta?: number | null
          avg_response_time?: number | null
          created_at?: string
          documents_url?: string | null
          experience_years?: number | null
          full_name: string
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          latitude: number
          longitude: number
          phone?: string | null
          profile_photo_url?: string | null
          rating?: number | null
          recent_jobs_count?: number | null
          services_offered?: string[] | null
          specialization?: string | null
          total_earnings?: number | null
          total_jobs_count?: number | null
          total_rating_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active_jobs_count?: number | null
          address?: string | null
          avg_eta?: number | null
          avg_response_time?: number | null
          created_at?: string
          documents_url?: string | null
          experience_years?: number | null
          full_name?: string
          id?: string
          is_available?: boolean | null
          is_verified?: boolean | null
          latitude?: number
          longitude?: number
          phone?: string | null
          profile_photo_url?: string | null
          rating?: number | null
          recent_jobs_count?: number | null
          services_offered?: string[] | null
          specialization?: string | null
          total_earnings?: number | null
          total_jobs_count?: number | null
          total_rating_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          booking_updates: boolean | null
          created_at: string
          id: string
          mechanic_arrival: boolean | null
          payment_confirmations: boolean | null
          promotional: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_updates?: boolean | null
          created_at?: string
          id?: string
          mechanic_arrival?: boolean | null
          payment_confirmations?: boolean | null
          promotional?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_updates?: boolean | null
          created_at?: string
          id?: string
          mechanic_arrival?: boolean | null
          payment_confirmations?: boolean | null
          promotional?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_default: boolean | null
          masked_identifier: string
          method_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          is_default?: boolean | null
          masked_identifier: string
          method_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_default?: boolean | null
          masked_identifier?: string
          method_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      service_request_responses: {
        Row: {
          created_at: string
          id: string
          mechanic_id: string
          request_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          mechanic_id: string
          request_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          mechanic_id?: string
          request_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_request_responses_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_request_responses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          address: string | null
          created_at: string
          expires_at: string
          id: string
          issue_description: string | null
          latitude: number
          longitude: number
          radius_km: number | null
          service_type: string
          status: string
          target_mechanic_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          issue_description?: string | null
          latitude: number
          longitude: number
          radius_km?: number | null
          service_type: string
          status?: string
          target_mechanic_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          issue_description?: string | null
          latitude?: number
          longitude?: number
          radius_km?: number | null
          service_type?: string
          status?: string
          target_mechanic_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_target_mechanic_id_fkey"
            columns: ["target_mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          booking_id: string
          created_at: string
          dispute_photos: string[] | null
          dispute_reason: string | null
          disputed_at: string | null
          id: string
          mechanic_id: string
          mechanic_quote: number
          mechanic_share: number
          paid_at: string | null
          platform_fee: number
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          razorpay_signature: string | null
          refunded_at: string | null
          released_at: string | null
          status: string
          updated_at: string
          user_id: string
          user_paid_total: number
        }
        Insert: {
          booking_id: string
          created_at?: string
          dispute_photos?: string[] | null
          dispute_reason?: string | null
          disputed_at?: string | null
          id?: string
          mechanic_id: string
          mechanic_quote?: number
          mechanic_share?: number
          paid_at?: string | null
          platform_fee?: number
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          refunded_at?: string | null
          released_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
          user_paid_total?: number
        }
        Update: {
          booking_id?: string
          created_at?: string
          dispute_photos?: string[] | null
          dispute_reason?: string | null
          disputed_at?: string | null
          id?: string
          mechanic_id?: string
          mechanic_quote?: number
          mechanic_share?: number
          paid_at?: string | null
          platform_fee?: number
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          razorpay_signature?: string | null
          refunded_at?: string | null
          released_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          user_paid_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_mechanic_id_fkey"
            columns: ["mechanic_id"]
            isOneToOne: false
            referencedRelation: "mechanics"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          brand: string
          created_at: string
          fuel_type: string
          id: string
          is_default: boolean | null
          model: string
          updated_at: string
          user_id: string
          vehicle_number: string
          vehicle_type: string
        }
        Insert: {
          brand: string
          created_at?: string
          fuel_type: string
          id?: string
          is_default?: boolean | null
          model: string
          updated_at?: string
          user_id: string
          vehicle_number: string
          vehicle_type: string
        }
        Update: {
          brand?: string
          created_at?: string
          fuel_type?: string
          id?: string
          is_default?: boolean | null
          model?: string
          updated_at?: string
          user_id?: string
          vehicle_number?: string
          vehicle_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: { Args: { _user_id: string }; Returns: string }
      has_active_booking_with_mechanic: {
        Args: { _mechanic_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "user" | "mechanic"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["user", "mechanic"],
    },
  },
} as const
