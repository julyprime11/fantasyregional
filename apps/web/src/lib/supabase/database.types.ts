// Manually maintained to match supabase/migrations/20260928000100_initial_schema.sql.
// Replace with generated Supabase types when CLI tooling is introduced.
import type { PlayerPosition } from "@regional-fantasy/shared";

export type MatchStatus = "scheduled" | "finished" | "voting" | "closed";

export type Database = {
  public: {
    Tables: {
      clubs: {
        Row: {
          id: string;
          name: string;
          short_name: string | null;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          short_name?: string | null;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          short_name?: string | null;
          logo_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          club_id: string;
          name: string;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          club_id: string;
          name: string;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          club_id?: string;
          name?: string;
          category?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teams_club_id_fkey";
            columns: ["club_id"];
            isOneToOne: false;
            referencedRelation: "clubs";
            referencedColumns: ["id"];
          },
        ];
      };
      players: {
        Row: {
          id: string;
          team_id: string;
          first_name: string;
          last_name: string | null;
          shirt_number: number | null;
          position: PlayerPosition;
          image_url: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          first_name: string;
          last_name?: string | null;
          shirt_number?: number | null;
          position: PlayerPosition;
          image_url?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          first_name?: string;
          last_name?: string | null;
          shirt_number?: number | null;
          position?: PlayerPosition;
          image_url?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "players_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      staff: {
        Row: {
          id: string;
          team_id: string;
          first_name: string;
          last_name: string | null;
          role: string;
          image_url: string | null;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          first_name: string;
          last_name?: string | null;
          role: string;
          image_url?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          first_name?: string;
          last_name?: string | null;
          role?: string;
          image_url?: string | null;
          active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "staff_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      seasons: {
        Row: {
          id: string;
          name: string;
          start_date: string | null;
          end_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          start_date?: string | null;
          end_date?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      competitions: {
        Row: {
          id: string;
          season_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          season_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          season_id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "competitions_season_id_fkey";
            columns: ["season_id"];
            isOneToOne: false;
            referencedRelation: "seasons";
            referencedColumns: ["id"];
          },
        ];
      };
      matches: {
        Row: {
          id: string;
          competition_id: string | null;
          home_team_id: string;
          away_team_id: string;
          match_date: string;
          home_score: number | null;
          away_score: number | null;
          status: MatchStatus;
          voting_opens_at: string | null;
          voting_closes_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          competition_id?: string | null;
          home_team_id: string;
          away_team_id: string;
          match_date: string;
          home_score?: number | null;
          away_score?: number | null;
          status?: MatchStatus;
          voting_opens_at?: string | null;
          voting_closes_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          competition_id?: string | null;
          home_team_id?: string;
          away_team_id?: string;
          match_date?: string;
          home_score?: number | null;
          away_score?: number | null;
          status?: MatchStatus;
          voting_opens_at?: string | null;
          voting_closes_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "matches_competition_id_fkey";
            columns: ["competition_id"];
            isOneToOne: false;
            referencedRelation: "competitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_home_team_id_fkey";
            columns: ["home_team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "matches_away_team_id_fkey";
            columns: ["away_team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      match_players: {
        Row: {
          id: string;
          match_id: string;
          player_id: string;
          team_id: string;
          starter: boolean;
          minutes_played: number;
          goals: number;
          assists: number;
          yellow_cards: number;
          red_cards: number;
          clean_sheet: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          player_id: string;
          team_id: string;
          starter?: boolean;
          minutes_played?: number;
          goals?: number;
          assists?: number;
          yellow_cards?: number;
          red_cards?: number;
          clean_sheet?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          player_id?: string;
          team_id?: string;
          starter?: boolean;
          minutes_played?: number;
          goals?: number;
          assists?: number;
          yellow_cards?: number;
          red_cards?: number;
          clean_sheet?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "match_players_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_players_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "match_players_team_id_fkey";
            columns: ["team_id"];
            isOneToOne: false;
            referencedRelation: "teams";
            referencedColumns: ["id"];
          },
        ];
      };
      ratings: {
        Row: {
          id: string;
          match_id: string;
          player_id: string;
          voter_id: string;
          voter_role: string;
          score: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          player_id: string;
          voter_id: string;
          voter_role: string;
          score: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          player_id?: string;
          voter_id?: string;
          voter_role?: string;
          score?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ratings_match_id_fkey";
            columns: ["match_id"];
            isOneToOne: false;
            referencedRelation: "matches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ratings_player_id_fkey";
            columns: ["player_id"];
            isOneToOne: false;
            referencedRelation: "players";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
