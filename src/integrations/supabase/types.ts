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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      asks: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          jersey_id: string
          price_cents: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          jersey_id: string
          price_cents: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          jersey_id?: string
          price_cents?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asks_jersey_id_fkey"
            columns: ["jersey_id"]
            isOneToOne: false
            referencedRelation: "user_jerseys"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_ask_matches: {
        Row: {
          ask_id: string
          bid_id: string
          created_at: string
          id: string
          jersey_id: string
          matched_price_cents: number
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          ask_id: string
          bid_id: string
          created_at?: string
          id?: string
          jersey_id: string
          matched_price_cents: number
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          ask_id?: string
          bid_id?: string
          created_at?: string
          id?: string
          jersey_id?: string
          matched_price_cents?: number
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bid_ask_matches_ask_id_fkey"
            columns: ["ask_id"]
            isOneToOne: false
            referencedRelation: "asks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_ask_matches_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_ask_matches_jersey_id_fkey"
            columns: ["jersey_id"]
            isOneToOne: false
            referencedRelation: "user_jerseys"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          jersey_id: string
          price_cents: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          jersey_id: string
          price_cents: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          jersey_id?: string
          price_cents?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_jersey_id_fkey"
            columns: ["jersey_id"]
            isOneToOne: false
            referencedRelation: "user_jerseys"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
      forum_comments: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          image_urls: string[]
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_urls?: string[]
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_urls?: string[]
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          category_id: string
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          image_urls: string[]
          pinned: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_urls?: string[]
          pinned?: boolean
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_urls?: string[]
          pinned?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "forum_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      jersey_favorites: {
        Row: {
          created_at: string
          id: string
          jersey_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          jersey_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          jersey_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "jersey_favorites_jersey_id_fkey"
            columns: ["jersey_id"]
            isOneToOne: false
            referencedRelation: "user_jerseys"
            referencedColumns: ["id"]
          },
        ]
      }
      jersey_price_references: {
        Row: {
          condition: string | null
          currency: string
          id: string
          sale_date: string | null
          sale_price_cents: number
          scraped_at: string
          season: string | null
          size: string | null
          source_url: string | null
          team: string
          year: number | null
        }
        Insert: {
          condition?: string | null
          currency?: string
          id?: string
          sale_date?: string | null
          sale_price_cents: number
          scraped_at?: string
          season?: string | null
          size?: string | null
          source_url?: string | null
          team: string
          year?: number | null
        }
        Update: {
          condition?: string | null
          currency?: string
          id?: string
          sale_date?: string | null
          sale_price_cents?: number
          scraped_at?: string
          season?: string | null
          size?: string | null
          source_url?: string | null
          team?: string
          year?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          deleted_at: string | null
          display_name: string | null
          id: string
          onboarding_completed: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          id: string
          onboarding_completed?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          id?: string
          onboarding_completed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      trade_requests: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          message: string | null
          owner_jersey_id: string
          requester_jersey_id: string
          status: Database["public"]["Enums"]["trade_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          message?: string | null
          owner_jersey_id: string
          requester_jersey_id: string
          status?: Database["public"]["Enums"]["trade_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          message?: string | null
          owner_jersey_id?: string
          requester_jersey_id?: string
          status?: Database["public"]["Enums"]["trade_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_requests_owner_jersey_id_fkey"
            columns: ["owner_jersey_id"]
            isOneToOne: false
            referencedRelation: "user_jerseys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trade_requests_requester_jersey_id_fkey"
            columns: ["requester_jersey_id"]
            isOneToOne: false
            referencedRelation: "user_jerseys"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount_cents: number
          buyer_id: string
          created_at: string
          id: string
          jersey_id: string
          platform_fee_cents: number
          seller_id: string
          status: string
          stripe_session_id: string
        }
        Insert: {
          amount_cents: number
          buyer_id: string
          created_at?: string
          id?: string
          jersey_id: string
          platform_fee_cents: number
          seller_id: string
          status?: string
          stripe_session_id: string
        }
        Update: {
          amount_cents?: number
          buyer_id?: string
          created_at?: string
          id?: string
          jersey_id?: string
          platform_fee_cents?: number
          seller_id?: string
          status?: string
          stripe_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_jersey_id_fkey"
            columns: ["jersey_id"]
            isOneToOne: false
            referencedRelation: "user_jerseys"
            referencedColumns: ["id"]
          },
        ]
      }
      user_jerseys: {
        Row: {
          available_for_trade: boolean
          condition: number
          created_at: string
          deleted_at: string | null
          description: string | null
          id: string
          image_url: string | null
          image_urls: string[]
          is_featured: boolean
          league: string
          listing_type: string | null
          name: string
          price_cents: number | null
          sale_price_cents: number | null
          size: string
          team: string
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          verified_at: string | null
          verified_by: string | null
          year: string
        }
        Insert: {
          available_for_trade?: boolean
          condition?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[]
          is_featured?: boolean
          league?: string
          listing_type?: string | null
          name: string
          price_cents?: number | null
          sale_price_cents?: number | null
          size?: string
          team: string
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          verified_by?: string | null
          year?: string
        }
        Update: {
          available_for_trade?: boolean
          condition?: number
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[]
          is_featured?: boolean
          league?: string
          listing_type?: string | null
          name?: string
          price_cents?: number | null
          sale_price_cents?: number | null
          size?: string
          team?: string
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          verified_at?: string | null
          verified_by?: string | null
          year?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_price_intelligence: {
        Args: {
          p_condition?: string
          p_size?: string
          p_team: string
          p_year: number
        }
        Returns: {
          comparable_count: number
          fair_value_max_cents: number
          fair_value_mid_cents: number
          fair_value_min_cents: number
        }[]
      }
      is_jersey_owner: { Args: { _jersey_id: string }; Returns: boolean }
    }
    Enums: {
      trade_status: "pending" | "accepted" | "declined" | "completed"
      verification_status: "pending" | "verified" | "rejected"
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
      trade_status: ["pending", "accepted", "declined", "completed"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
