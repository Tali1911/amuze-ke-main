export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      calendar_events: {
        Row: {
          color: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          end_date: string;
          event_type: string | null;
          id: string;
          location: string | null;
          max_attendees: number | null;
          program_pdf: string | null;
          program_type: string | null;
          registration_url: string | null;
          start_date: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          end_date: string;
          event_type?: string | null;
          id?: string;
          location?: string | null;
          max_attendees?: number | null;
          program_pdf?: string | null;
          program_type?: string | null;
          registration_url?: string | null;
          start_date: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          end_date?: string;
          event_type?: string | null;
          id?: string;
          location?: string | null;
          max_attendees?: number | null;
          program_pdf?: string | null;
          program_type?: string | null;
          registration_url?: string | null;
          start_date?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      camp_attendance: {
        Row: {
          attendance_date: string;
          check_in_time: string;
          check_out_time: string | null;
          child_name: string;
          created_at: string | null;
          id: string;
          marked_by: string | null;
          notes: string | null;
          registration_id: string;
        };
        Insert: {
          attendance_date?: string;
          check_in_time?: string;
          check_out_time?: string | null;
          child_name: string;
          created_at?: string | null;
          id?: string;
          marked_by?: string | null;
          notes?: string | null;
          registration_id: string;
        };
        Update: {
          attendance_date?: string;
          check_in_time?: string;
          check_out_time?: string | null;
          child_name?: string;
          created_at?: string | null;
          id?: string;
          marked_by?: string | null;
          notes?: string | null;
          registration_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "camp_attendance_marked_by_fkey";
            columns: ["marked_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "camp_attendance_registration_id_fkey";
            columns: ["registration_id"];
            isOneToOne: false;
            referencedRelation: "camp_registrations";
            referencedColumns: ["id"];
          },
        ];
      };
      camp_registrations: {
        Row: {
          admin_notes: string | null;
          camp_type: string;
          children: Json;
          consent_given: boolean | null;
          created_at: string | null;
          created_by: string | null;
          email: string;
          emergency_contact: string | null;
          id: string;
          parent_name: string;
          payment_method: string | null;
          payment_reference: string | null;
          payment_status: string;
          phone: string;
          qr_code_data: string;
          registration_number: string;
          registration_type: string;
          status: string | null;
          total_amount: number;
          updated_at: string | null;
        };
        Insert: {
          admin_notes?: string | null;
          camp_type: string;
          children?: Json;
          consent_given?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          email: string;
          emergency_contact?: string | null;
          id?: string;
          parent_name: string;
          payment_method?: string | null;
          payment_reference?: string | null;
          payment_status?: string;
          phone: string;
          qr_code_data: string;
          registration_number: string;
          registration_type?: string;
          status?: string | null;
          total_amount?: number;
          updated_at?: string | null;
        };
        Update: {
          admin_notes?: string | null;
          camp_type?: string;
          children?: Json;
          consent_given?: boolean | null;
          created_at?: string | null;
          created_by?: string | null;
          email?: string;
          emergency_contact?: string | null;
          id?: string;
          parent_name?: string;
          payment_method?: string | null;
          payment_reference?: string | null;
          payment_status?: string;
          phone?: string;
          qr_code_data?: string;
          registration_number?: string;
          registration_type?: string;
          status?: string | null;
          total_amount?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "camp_registrations_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      campaigns: {
        Row: {
          campaign_type: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          end_date: string | null;
          id: string;
          metrics: Json | null;
          name: string;
          start_date: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          campaign_type?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          metrics?: Json | null;
          name: string;
          start_date?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          campaign_type?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          end_date?: string | null;
          id?: string;
          metrics?: Json | null;
          name?: string;
          start_date?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      content_items: {
        Row: {
          author_id: string | null;
          content: string | null;
          content_type: string | null;
          created_at: string | null;
          id: string;
          metadata: Json | null;
          published_at: string | null;
          slug: string;
          status: string | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          author_id?: string | null;
          content?: string | null;
          content_type?: string | null;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          published_at?: string | null;
          slug: string;
          status?: string | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          author_id?: string | null;
          content?: string | null;
          content_type?: string | null;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          published_at?: string | null;
          slug?: string;
          status?: string | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      faq_items: {
        Row: {
          answer: string;
          created_at: string | null;
          display_order: number | null;
          id: string;
          is_popular: boolean | null;
          question: string;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          answer: string;
          created_at?: string | null;
          display_order?: number | null;
          id?: string;
          is_popular?: boolean | null;
          question: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          answer?: string;
          created_at?: string | null;
          display_order?: number | null;
          id?: string;
          is_popular?: boolean | null;
          question?: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          assigned_to: string | null;
          created_at: string | null;
          email: string;
          form_data: Json | null;
          full_name: string;
          id: string;
          notes: string | null;
          phone: string | null;
          program_type: string;
          source: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          created_at?: string | null;
          email: string;
          form_data?: Json | null;
          full_name: string;
          id?: string;
          notes?: string | null;
          phone?: string | null;
          program_type: string;
          source?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          created_at?: string | null;
          email?: string;
          form_data?: Json | null;
          full_name?: string;
          id?: string;
          notes?: string | null;
          phone?: string | null;
          program_type?: string;
          source?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      navigation_settings: {
        Row: {
          created_at: string | null;
          display_order: number;
          id: string;
          is_visible: boolean | null;
          label: string;
          nav_key: string;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string | null;
          display_order: number;
          id?: string;
          is_visible?: boolean | null;
          label: string;
          nav_key: string;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          display_order?: number;
          id?: string;
          is_visible?: boolean | null;
          label?: string;
          nav_key?: string;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          approval_status: string | null;
          approved_at: string | null;
          approved_by: string | null;
          created_at: string | null;
          department: string | null;
          email: string | null;
          full_name: string | null;
          id: string;
          rejection_reason: string | null;
          updated_at: string | null;
        };
        Insert: {
          approval_status?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string | null;
          department?: string | null;
          email?: string | null;
          full_name?: string | null;
          id: string;
          rejection_reason?: string | null;
          updated_at?: string | null;
        };
        Update: {
          approval_status?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string | null;
          department?: string | null;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          rejection_reason?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string | null;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      approve_user_with_role: {
        Args: {
          _approved_by: string;
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: undefined;
      };
      change_user_role: {
        Args: {
          _changed_by: string;
          _new_role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: undefined;
      };
      generate_registration_number: { Args: never; Returns: string };
      get_all_users_for_admin: {
        Args: never;
        Returns: {
          approval_status: string;
          approved_at: string;
          created_at: string;
          department: string;
          email: string;
          full_name: string;
          role: string;
          user_id: string;
        }[];
      };
      get_todays_attendance: {
        Args: { p_camp_type?: string };
        Returns: {
          check_in_time: string;
          check_out_time: string;
          child_name: string;
          parent_name: string;
          payment_status: string;
          registration_id: string;
          registration_number: string;
        }[];
      };
      get_user_email: { Args: { _user_id: string }; Returns: string };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      reject_user: {
        Args: {
          _rejected_by: string;
          _rejection_reason: string;
          _user_id: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "admin" | "ceo" | "marketing" | "hr" | "accounts" | "coach" | "governance";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "ceo", "marketing", "hr", "accounts", "coach", "governance"],
    },
  },
} as const;
