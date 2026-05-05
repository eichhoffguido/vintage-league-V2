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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
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
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
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
      sales_history: {
        Row: {
          buyer_user_id: string | null
          condition: number
          id: string
          jersey_id: string
          league: string
          sale_price_cents: number
          seller_user_id: string
          sold_at: string
          team: string
          trade_request_id: string | null
          year: string
        }
        Insert: {
          buyer_user_id?: string | null
          condition: number
          id?: string
          jersey_id: string
          league: string
          sale_price_cents: number
          seller_user_id: string
          sold_at?: string
          team: string
          trade_request_id?: string | null
          year: string
        }
        Update: {
          buyer_user_id?: string | null
          condition?: number
          id?: string
          jersey_id?: string
          league?: string
          sale_price_cents?: number
          seller_user_id?: string
          sold_at?: string
          team?: string
          trade_request_id?: string | null
          year?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_history_jersey_id_fkey"
            columns: ["jersey_id"]
            isOneToOne: false
            referencedRelation: "user_jerseys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_history_trade_request_id_fkey"
            columns: ["trade_request_id"]
            isOneToOne: false
            referencedRelation: "trade_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          average_rating: number | null
          bio: string | null
          created_at: string
          deleted_at: string | null
          display_name: string | null
          id: string
          is_admin: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          id: string
          is_admin?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          id?: string
          is_admin?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      trade_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rated_user_id: string
          rater_user_id: string
          rating: number
          trade_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rated_user_id: string
          rater_user_id: string
          rating: number
          trade_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rated_user_id?: string
          rater_user_id?: string
          rating?: number
          trade_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_ratings_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trade_requests"
            referencedColumns: ["id"]
          },
        ]
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
      user_jerseys: {
        Row: {
          available_for_trade: boolean
          condition: number
          created_at: string
          deleted_at: string | null
          id: string
          image_url: string | null
          league: string
          listing_type: "trade_only" | "buy_now" | "both"
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
          id?: string
          image_url?: string | null
          league?: string
          listing_type?: "trade_only" | "buy_now" | "both"
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
          id?: string
          image_url?: string | null
          league?: string
          listing_type?: "trade_only" | "buy_now" | "both"
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
          {
            foreignKeyName: "jersey_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
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
            foreignKeyName: "user_favorites_jersey_id_fkey"
            columns: ["jersey_id"]
            isOneToOne: false
            referencedRelation: "user_jerseys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_recent_sales_by_team_year: {
        Args: { p_team: string; p_year: string; p_limit?: number }
        Returns: {
          id: string
          jersey_id: string
          sale_price_cents: number
          team: string
          league: string
          year: string
          condition: number
          sold_at: string
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      trade_status: ["pending", "accepted", "declined", "completed"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
