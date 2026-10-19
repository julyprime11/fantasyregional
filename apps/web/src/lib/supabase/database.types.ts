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
      clubs: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          short_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          short_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          short_name?: string | null
        }
        Relationships: []
      }
      competitions: {
        Row: {
          created_at: string
          id: string
          name: string
          season_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          season_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          season_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competitions_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      fantasy_league_members: {
        Row: {
          id: string
          joined_at: string
          league_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          league_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          league_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fantasy_league_members_league_id_fkey"
            columns: ["league_id"]
            isOneToOne: false
            referencedRelation: "fantasy_leagues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fantasy_league_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      fantasy_leagues: {
        Row: {
          code: string
          created_at: string
          created_by: string
          id: string
          name: string
          team_id: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by: string
          id?: string
          name: string
          team_id: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fantasy_leagues_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fantasy_leagues_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      fantasy_lineup_players: {
        Row: {
          created_at: string
          id: string
          lineup_id: string
          player_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lineup_id: string
          player_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lineup_id?: string
          player_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fantasy_lineup_players_lineup_id_fkey"
            columns: ["lineup_id"]
            isOneToOne: false
            referencedRelation: "fantasy_lineups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fantasy_lineup_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      fantasy_lineups: {
        Row: {
          captain_player_id: string | null
          created_at: string
          id: string
          league_id: string
          locked_at: string | null
          match_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          captain_player_id?: string | null
          created_at?: string
          id?: string
          league_id: string
          locked_at?: string | null
          match_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          captain_player_id?: string | null
          created_at?: string
          id?: string
          league_id?: string
          locked_at?: string | null
          match_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fantasy_lineups_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fantasy_lineups_membership_fk"
            columns: ["league_id", "user_id"]
            isOneToOne: false
            referencedRelation: "fantasy_league_members"
            referencedColumns: ["league_id", "user_id"]
          },
        ]
      }
      match_events: {
        Row: {
          created_at: string
          created_by: string | null
          event_type: string
          id: string
          match_id: string
          minute: number
          scoring_team_id: string | null
          is_own_goal: boolean
          player_id: string | null
          secondary_player_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_type: string
          id?: string
          match_id: string
          minute?: number
          scoring_team_id?: string | null
          is_own_goal?: boolean
          player_id?: string | null
          secondary_player_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_type?: string
          id?: string
          match_id?: string
          minute?: number
          scoring_team_id?: string | null
          is_own_goal?: boolean
          player_id?: string | null
          secondary_player_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_events_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_events_secondary_player_id_fkey"
            columns: ["secondary_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      match_players: {
        Row: {
          assists: number
          card_dismissed: boolean
          clean_sheet: boolean
          created_at: string
          dismissal_minute: number | null
          entered_minute: number | null
          goals: number
          id: string
          match_id: string
          minutes_played: number
          on_field: boolean
          player_id: string
          red_card_reason: string | null
          red_cards: number
          starter: boolean
          stats_completed: boolean
          team_id: string
          yellow_cards: number
        }
        Insert: {
          assists?: number
          card_dismissed?: boolean
          clean_sheet?: boolean
          created_at?: string
          dismissal_minute?: number | null
          entered_minute?: number | null
          goals?: number
          id?: string
          match_id: string
          minutes_played?: number
          on_field?: boolean
          player_id: string
          red_card_reason?: string | null
          red_cards?: number
          starter?: boolean
          stats_completed?: boolean
          team_id: string
          yellow_cards?: number
        }
        Update: {
          assists?: number
          card_dismissed?: boolean
          clean_sheet?: boolean
          created_at?: string
          dismissal_minute?: number | null
          entered_minute?: number | null
          goals?: number
          id?: string
          match_id?: string
          minutes_played?: number
          on_field?: boolean
          player_id?: string
          red_card_reason?: string | null
          red_cards?: number
          starter?: boolean
          stats_completed?: boolean
          team_id?: string
          yellow_cards?: number
        }
        Relationships: [
          {
            foreignKeyName: "match_players_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number | null
          away_team_id: string
          competition_id: string | null
          created_at: string
          home_score: number | null
          home_team_id: string
          id: string
          live_clock_seconds: number
          live_clock_started_at: string | null
          live_finished_at: string | null
          live_phase: string
          live_started_at: string | null
          match_date: string
          status: string
          voting_closes_at: string | null
          voting_opens_at: string | null
        }
        Insert: {
          away_score?: number | null
          away_team_id: string
          competition_id?: string | null
          created_at?: string
          home_score?: number | null
          home_team_id: string
          id?: string
          live_clock_seconds?: number
          live_clock_started_at?: string | null
          live_finished_at?: string | null
          live_phase?: string
          live_started_at?: string | null
          match_date: string
          status?: string
          voting_closes_at?: string | null
          voting_opens_at?: string | null
        }
        Update: {
          away_score?: number | null
          away_team_id?: string
          competition_id?: string | null
          created_at?: string
          home_score?: number | null
          home_team_id?: string
          id?: string
          live_clock_seconds?: number
          live_clock_started_at?: string | null
          live_finished_at?: string | null
          live_phase?: string
          live_started_at?: string | null
          match_date?: string
          status?: string
          voting_closes_at?: string | null
          voting_opens_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          active: boolean
          created_at: string
          ffcv_last_sync_at: string | null
          ffcv_player_code: string | null
          first_name: string
          id: string
          image_url: string | null
          last_name: string | null
          position: string
          shirt_number: number | null
          team_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          ffcv_last_sync_at?: string | null
          ffcv_player_code?: string | null
          first_name: string
          id?: string
          image_url?: string | null
          last_name?: string | null
          position: string
          shirt_number?: number | null
          team_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          ffcv_last_sync_at?: string | null
          ffcv_player_code?: string | null
          first_name?: string
          id?: string
          image_url?: string | null
          last_name?: string | null
          position?: string
          shirt_number?: number | null
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          voter_role: string | null
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          voter_role?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          voter_role?: string | null
        }
        Relationships: []
      }
      ratings: {
        Row: {
          created_at: string
          id: string
          match_id: string
          player_id: string
          score: number
          voter_id: string
          voter_role: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          player_id: string
          score: number
          voter_id: string
          voter_role: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          player_id?: string
          score?: number
          voter_id?: string
          voter_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ratings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          name: string
          start_date: string | null
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          name: string
          start_date?: string | null
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          name?: string
          start_date?: string | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          active: boolean
          created_at: string
          first_name: string
          id: string
          image_url: string | null
          last_name: string | null
          role: string
          team_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          first_name: string
          id?: string
          image_url?: string | null
          last_name?: string | null
          role: string
          team_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          first_name?: string
          id?: string
          image_url?: string | null
          last_name?: string | null
          role?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          category: string | null
          club_id: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          club_id: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          club_id?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      register_live_goal_without_player: {
        Args: { p_match_id: string; p_scoring_team_id: string; p_is_own_goal?: boolean }
        Returns: number
      }
      register_match_goal_without_player: {
        Args: {
          p_match_id: string
          p_scoring_team_id: string
          p_minute: number
          p_is_own_goal?: boolean
        }
        Returns: string
      }
      finalize_match_player_minutes: {
        Args: { p_match_id: string }
        Returns: undefined
      }
      increment_match_player_stat: {
        Args: {
          p_delta: number
          p_entry_id: string
          p_field: string
          p_match_id: string
        }
        Returns: number
      }
      perform_match_substitution: {
        Args: {
          p_match_id: string
          p_player_in_entry_id: string
          p_player_out_entry_id: string
        }
        Returns: {
          event_id: string
          event_minute: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
  public: {
    Enums: {},
  },
} as const
