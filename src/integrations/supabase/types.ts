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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          auth_user_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          role?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      application_settings: {
        Row: {
          graduation_date: string
          graduation_description: string | null
          graduation_location: string | null
          graduation_title: string
          id: number
          messages_enabled: boolean
          public_results_enabled: boolean
          updated_at: string
          voting_open: boolean
        }
        Insert: {
          graduation_date: string
          graduation_description?: string | null
          graduation_location?: string | null
          graduation_title: string
          id?: number
          messages_enabled?: boolean
          public_results_enabled?: boolean
          updated_at?: string
          voting_open?: boolean
        }
        Update: {
          graduation_date?: string
          graduation_description?: string | null
          graduation_location?: string | null
          graduation_title?: string
          id?: number
          messages_enabled?: boolean
          public_results_enabled?: boolean
          updated_at?: string
          voting_open?: boolean
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      graduation_messages: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          is_approved: boolean
          message: string
          student_id: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          message?: string
          student_id: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          message?: string
          student_id?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "graduation_messages_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      hubs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          admin_feedback: string | null
          cover_image_url: string | null
          created_at: string
          department_id: string
          description: string | null
          document_url: string | null
          hub_id: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          project_type: string
          project_url: string | null
          reviewed_at: string | null
          short_description: string | null
          student_id: string
          submission_status: string
          submitted_at: string | null
          title: string
          tools_used: string[]
          updated_at: string
          video_url: string | null
        }
        Insert: {
          admin_feedback?: string | null
          cover_image_url?: string | null
          created_at?: string
          department_id: string
          description?: string | null
          document_url?: string | null
          hub_id?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          project_type?: string
          project_url?: string | null
          reviewed_at?: string | null
          short_description?: string | null
          student_id: string
          submission_status?: string
          submitted_at?: string | null
          title: string
          tools_used?: string[]
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          admin_feedback?: string | null
          cover_image_url?: string | null
          created_at?: string
          department_id?: string
          description?: string | null
          document_url?: string | null
          hub_id?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          project_type?: string
          project_url?: string | null
          reviewed_at?: string | null
          short_description?: string | null
          student_id?: string
          submission_status?: string
          submitted_at?: string | null
          title?: string
          tools_used?: string[]
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          account_status: string
          auth_user_id: string | null
          avatar_url: string | null
          behance_url: string | null
          bio: string | null
          created_at: string
          department_id: string | null
          email: string
          full_name: string
          github_url: string | null
          graduation_year: number
          hub_id: string | null
          id: string
          is_active: boolean
          is_demo: boolean
          is_nominee: boolean
          linkedin_url: string | null
          phone: string | null
          portfolio_url: string | null
          student_code: string | null
          updated_at: string
        }
        Insert: {
          account_status?: string
          auth_user_id?: string | null
          avatar_url?: string | null
          behance_url?: string | null
          bio?: string | null
          created_at?: string
          department_id?: string | null
          email: string
          full_name: string
          github_url?: string | null
          graduation_year?: number
          hub_id?: string | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          is_nominee?: boolean
          linkedin_url?: string | null
          phone?: string | null
          portfolio_url?: string | null
          student_code?: string | null
          updated_at?: string
        }
        Update: {
          account_status?: string
          auth_user_id?: string | null
          avatar_url?: string | null
          behance_url?: string | null
          bio?: string | null
          created_at?: string
          department_id?: string | null
          email?: string
          full_name?: string
          github_url?: string | null
          graduation_year?: number
          hub_id?: string | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          is_nominee?: boolean
          linkedin_url?: string | null
          phone?: string | null
          portfolio_url?: string | null
          student_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "students_hub_id_fkey"
            columns: ["hub_id"]
            isOneToOne: false
            referencedRelation: "hubs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      votes: {
        Row: {
          created_at: string
          department_id: string
          id: string
          nominee_student_id: string
          voter_student_id: string
        }
        Insert: {
          created_at?: string
          department_id: string
          id?: string
          nominee_student_id: string
          voter_student_id: string
        }
        Update: {
          created_at?: string
          department_id?: string
          id?: string
          nominee_student_id?: string
          voter_student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "votes_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_nominee_student_id_fkey"
            columns: ["nominee_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_voter_student_id_fkey"
            columns: ["voter_student_id"]
            isOneToOne: true
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_list_students: {
        Args: never
        Returns: {
          account_linked: boolean
          avatar_url: string
          behance_url: string
          bio: string
          created_at: string
          department_id: string
          email: string
          full_name: string
          github_url: string
          graduation_year: number
          has_voted: boolean
          hub_id: string
          id: string
          is_active: boolean
          is_demo: boolean
          is_nominee: boolean
          linkedin_url: string
          phone: string
          portfolio_url: string
          project_status: string
          student_code: string
          votes_received: number
        }[]
      }
      cast_vote: { Args: { _nominee_id: string }; Returns: Json }
      current_student_id: { Args: never; Returns: string }
      ensure_my_student: { Args: never; Returns: string }
      get_my_student: {
        Args: never
        Returns: {
          avatar_url: string
          behance_url: string
          bio: string
          created_at: string
          department_id: string
          department_name: string
          email: string
          full_name: string
          github_url: string
          graduation_year: number
          has_voted: boolean
          hub_id: string
          hub_name: string
          id: string
          is_active: boolean
          is_nominee: boolean
          linkedin_url: string
          phone: string
          portfolio_url: string
          student_code: string
          voted_at: string
        }[]
      }
      get_public_results: {
        Args: never
        Returns: {
          avatar_url: string
          department_id: string
          full_name: string
          nominee_id: string
          vote_count: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      roster_lookup: {
        Args: { _email: string; _student_code: string }
        Returns: {
          account_linked: boolean
          is_active: boolean
          student_id: string
        }[]
      }
      save_my_project: {
        Args: {
          _cover_image_url: string
          _description: string
          _document_url: string
          _project_type: string
          _project_url: string
          _short_description: string
          _submit: boolean
          _title: string
          _tools_used: string[]
        }
        Returns: Json
      }
      set_my_headshot: { Args: { _path: string }; Returns: undefined }
      update_my_details: {
        Args: {
          _behance_url: string
          _bio: string
          _full_name: string
          _github_url: string
          _linkedin_url: string
          _phone: string
          _portfolio_url: string
        }
        Returns: undefined
      }
      update_my_profile: {
        Args: {
          _behance_url: string
          _bio: string
          _github_url: string
          _linkedin_url: string
          _portfolio_url: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin"
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
    Enums: {
      app_role: ["admin"],
    },
  },
} as const
