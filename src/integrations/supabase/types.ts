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
          ask_id: string | null
          bid_id: string | null
          created_at: string
          id: string
          jersey_id: string | null
          matched_price_cents: number
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          ask_id?: string | null
          bid_id?: string | null
          created_at?: string
          id?: string
          jersey_id?: string | null
          matched_price_cents: number
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          ask_id?: string | null
          bid_id?: string | null
          created_at?: string
          id?: string
          jersey_id?: string | null
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
      faq_items: {
        Row: {
          answer: string
          created_at: string
          deleted_at: string | null
          id: string
          is_active: boolean
          question: string
          sort: number
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          question: string
          sort?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_active?: boolean
          question?: string
          sort?: number
          updated_at?: string
        }
        Relationships: []
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
      forum_post_likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      hero_slides: {
        Row: {
          caption: string
          created_at: string
          deleted_at: string | null
          id: string
          image_alt: string
          image_path: string | null
          is_active: boolean
          label: string
          sort: number
          stamp: string[]
          subline: string
          updated_at: string
        }
        Insert: {
          caption?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_alt?: string
          image_path?: string | null
          is_active?: boolean
          label?: string
          sort?: number
          stamp?: string[]
          subline?: string
          updated_at?: string
        }
        Update: {
          caption?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          image_alt?: string
          image_path?: string | null
          is_active?: boolean
          label?: string
          sort?: number
          stamp?: string[]
          subline?: string
          updated_at?: string
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
      jersey_sold_notifications: {
        Row: {
          amount_cents: number
          buyer_id: string | null
          created_at: string
          id: string
          jersey_id: string
          read_at: string | null
          recipient_id: string
          type: string
        }
        Insert: {
          amount_cents: number
          buyer_id?: string | null
          created_at?: string
          id?: string
          jersey_id: string
          read_at?: string | null
          recipient_id: string
          type?: string
        }
        Update: {
          amount_cents?: number
          buyer_id?: string | null
          created_at?: string
          id?: string
          jersey_id?: string
          read_at?: string | null
          recipient_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "jersey_sold_notifications_jersey_id_fkey"
            columns: ["jersey_id"]
            isOneToOne: false
            referencedRelation: "user_jerseys"
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
          favorite_team: string | null
          id: string
          is_admin: boolean
          onboarding_completed: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          favorite_team?: string | null
          id: string
          is_admin?: boolean
          onboarding_completed?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          average_rating?: number | null
          bio?: string | null
          created_at?: string
          deleted_at?: string | null
          display_name?: string | null
          favorite_team?: string | null
          id?: string
          is_admin?: boolean
          onboarding_completed?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      sales_history: {
        Row: {
          buyer_user_id: string | null
          condition: number
          id: string
          jersey_id: string | null
          league: string
          sale_price_cents: number
          seller_user_id: string | null
          sold_at: string
          team: string
          trade_request_id: string | null
          year: string
        }
        Insert: {
          buyer_user_id?: string | null
          condition: number
          id?: string
          jersey_id?: string | null
          league: string
          sale_price_cents: number
          seller_user_id?: string | null
          sold_at?: string
          team: string
          trade_request_id?: string | null
          year: string
        }
        Update: {
          buyer_user_id?: string | null
          condition?: number
          id?: string
          jersey_id?: string | null
          league?: string
          sale_price_cents?: number
          seller_user_id?: string | null
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
      seller_payout_accounts: {
        Row: {
          charges_enabled: boolean
          created_at: string
          details_submitted: boolean
          payouts_enabled: boolean
          stripe_account_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          charges_enabled?: boolean
          created_at?: string
          details_submitted?: boolean
          payouts_enabled?: boolean
          stripe_account_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          charges_enabled?: boolean
          created_at?: string
          details_submitted?: boolean
          payouts_enabled?: boolean
          stripe_account_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_payout_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      site_content: {
        Row: {
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      stripe_events: {
        Row: {
          error: string | null
          id: string
          livemode: boolean
          processed_at: string | null
          received_at: string
          type: string
        }
        Insert: {
          error?: string | null
          id: string
          livemode: boolean
          processed_at?: string | null
          received_at?: string
          type: string
        }
        Update: {
          error?: string | null
          id?: string
          livemode?: boolean
          processed_at?: string | null
          received_at?: string
          type?: string
        }
        Relationships: []
      }
      team_name_aliases: {
        Row: {
          alias: string
          canonical_name: string
          created_at: string
          id: string
        }
        Insert: {
          alias: string
          canonical_name: string
          created_at?: string
          id?: string
        }
        Update: {
          alias?: string
          canonical_name?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      trade_confirmations: {
        Row: {
          confirmed_at: string | null
          id: string
          trade_id: string
          user_id: string
        }
        Insert: {
          confirmed_at?: string | null
          id?: string
          trade_id: string
          user_id: string
        }
        Update: {
          confirmed_at?: string | null
          id?: string
          trade_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trade_confirmations_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trade_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_ratings: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rated_user_id: string | null
          rater_user_id: string | null
          rating: number
          trade_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rated_user_id?: string | null
          rater_user_id?: string | null
          rating: number
          trade_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rated_user_id?: string | null
          rater_user_id?: string | null
          rating?: number
          trade_id?: string | null
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
      transactions: {
        Row: {
          amount_cents: number
          buyer_id: string | null
          checkout_expires_at: string | null
          created_at: string
          id: string
          jersey_id: string | null
          jersey_snapshot: Json | null
          livemode: boolean
          paid_at: string | null
          platform_fee_cents: number
          received_at: string | null
          received_by: string | null
          seller_id: string | null
          shipped_at: string | null
          shipping_address: Json | null
          shipping_carrier: string | null
          shipping_name: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          buyer_id?: string | null
          checkout_expires_at?: string | null
          created_at?: string
          id?: string
          jersey_id?: string | null
          jersey_snapshot?: Json | null
          livemode?: boolean
          paid_at?: string | null
          platform_fee_cents: number
          received_at?: string | null
          received_by?: string | null
          seller_id?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_carrier?: string | null
          shipping_name?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          buyer_id?: string | null
          checkout_expires_at?: string | null
          created_at?: string
          id?: string
          jersey_id?: string | null
          jersey_snapshot?: Json | null
          livemode?: boolean
          paid_at?: string | null
          platform_fee_cents?: number
          received_at?: string | null
          received_by?: string | null
          seller_id?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_carrier?: string | null
          shipping_name?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string
          tracking_number?: string | null
          updated_at?: string
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
          last_sale_price_cents: number | null
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
          last_sale_price_cents?: number | null
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
          last_sale_price_cents?: number | null
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
      community_post_count: { Args: never; Returns: number }
      confirm_order_received: {
        Args: { p_transaction_id: string }
        Returns: undefined
      }
      delete_account_data: { Args: { p_user_id: string }; Returns: undefined }
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
      get_recent_sales_by_team_year: {
        Args: { p_limit?: number; p_team: string; p_year: string }
        Returns: {
          condition: number
          id: string
          jersey_id: string
          league: string
          sale_price_cents: number
          sold_at: string
          team: string
          year: string
        }[]
      }
      homepage_stats: { Args: never; Returns: Json }
      is_admin: { Args: never; Returns: boolean }
      is_jersey_owner: { Args: { _jersey_id: string }; Returns: boolean }
      seller_can_receive_payments: {
        Args: { p_seller: string }
        Returns: boolean
      }
      mark_order_shipped: {
        Args: {
          p_carrier: string
          p_tracking_number: string
          p_transaction_id: string
        }
        Returns: undefined
      }
      soft_delete_user_jersey: {
        Args: { p_jersey_id: string }
        Returns: undefined
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
