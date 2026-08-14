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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          detail: string | null
          id: string
          minutes: number
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          detail?: string | null
          id?: string
          minutes?: number
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          detail?: string | null
          id?: string
          minutes?: number
          user_id?: string
        }
        Relationships: []
      }
      assessment_questions: {
        Row: {
          category: string
          correct_index: number
          created_at: string
          difficulty: string
          explanation: string | null
          id: string
          options: string[]
          question: string
        }
        Insert: {
          category: string
          correct_index: number
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          options: string[]
          question: string
        }
        Update: {
          category?: string
          correct_index?: number
          created_at?: string
          difficulty?: string
          explanation?: string | null
          id?: string
          options?: string[]
          question?: string
        }
        Relationships: []
      }
      assessment_results: {
        Row: {
          category: string
          created_at: string
          duration_seconds: number
          id: string
          score: number
          total: number
          user_id: string
          weak_areas: string[]
        }
        Insert: {
          category: string
          created_at?: string
          duration_seconds?: number
          id?: string
          score: number
          total: number
          user_id: string
          weak_areas?: string[]
        }
        Update: {
          category?: string
          created_at?: string
          duration_seconds?: number
          id?: string
          score?: number
          total?: number
          user_id?: string
          weak_areas?: string[]
        }
        Relationships: []
      }
      career_matches: {
        Row: {
          companies: string[]
          confidence: number
          created_at: string
          demand: string | null
          description: string | null
          growth: string | null
          id: string
          learning_path: string[]
          match_score: number
          missing_skills: string[]
          required_skills: string[]
          salary_range: string | null
          title: string
          user_id: string
        }
        Insert: {
          companies?: string[]
          confidence?: number
          created_at?: string
          demand?: string | null
          description?: string | null
          growth?: string | null
          id?: string
          learning_path?: string[]
          match_score?: number
          missing_skills?: string[]
          required_skills?: string[]
          salary_range?: string | null
          title: string
          user_id: string
        }
        Update: {
          companies?: string[]
          confidence?: number
          created_at?: string
          demand?: string | null
          description?: string | null
          growth?: string | null
          id?: string
          learning_path?: string[]
          match_score?: number
          missing_skills?: string[]
          required_skills?: string[]
          salary_range?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      career_paths: {
        Row: {
          category: string
          companies: string[]
          created_at: string
          demand: string
          description: string
          growth: string
          id: string
          learning_path: string[]
          required_skills: string[]
          salary_range: string
          slug: string
          title: string
        }
        Insert: {
          category?: string
          companies?: string[]
          created_at?: string
          demand: string
          description: string
          growth: string
          id?: string
          learning_path?: string[]
          required_skills?: string[]
          salary_range: string
          slug: string
          title: string
        }
        Update: {
          category?: string
          companies?: string[]
          created_at?: string
          demand?: string
          description?: string
          growth?: string
          id?: string
          learning_path?: string[]
          required_skills?: string[]
          salary_range?: string
          slug?: string
          title?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          category: string
          created_at: string
          credential_url: string | null
          file_path: string | null
          id: string
          issue_date: string | null
          issuer: string
          title: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          credential_url?: string | null
          file_path?: string | null
          id?: string
          issue_date?: string | null
          issuer: string
          title: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          credential_url?: string | null
          file_path?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_history: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          thread: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          thread?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          thread?: string
          user_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          category: string
          certificate: boolean
          created_at: string
          difficulty: string
          duration: string | null
          id: string
          image_url: string | null
          instructor: string | null
          price: string
          provider: string
          rating: number
          skills: string[]
          title: string
          url: string
        }
        Insert: {
          category?: string
          certificate?: boolean
          created_at?: string
          difficulty?: string
          duration?: string | null
          id?: string
          image_url?: string | null
          instructor?: string | null
          price?: string
          provider: string
          rating?: number
          skills?: string[]
          title: string
          url: string
        }
        Update: {
          category?: string
          certificate?: boolean
          created_at?: string
          difficulty?: string
          duration?: string | null
          id?: string
          image_url?: string | null
          instructor?: string | null
          price?: string
          provider?: string
          rating?: number
          skills?: string[]
          title?: string
          url?: string
        }
        Relationships: []
      }
      internships: {
        Row: {
          company: string
          duration: string | null
          experience: string
          id: string
          location: string
          logo_text: string | null
          posted_at: string
          role: string
          skills: string[]
          source: string
          stipend: string | null
          url: string
          work_mode: string
        }
        Insert: {
          company: string
          duration?: string | null
          experience?: string
          id?: string
          location?: string
          logo_text?: string | null
          posted_at?: string
          role: string
          skills?: string[]
          source: string
          stipend?: string | null
          url: string
          work_mode?: string
        }
        Update: {
          company?: string
          duration?: string | null
          experience?: string
          id?: string
          location?: string
          logo_text?: string | null
          posted_at?: string
          role?: string
          skills?: string[]
          source?: string
          stipend?: string | null
          url?: string
          work_mode?: string
        }
        Relationships: []
      }
      interview_sessions: {
        Row: {
          category: string
          completed: boolean
          created_at: string
          feedback: string | null
          id: string
          score: number | null
          transcript: Json
          user_id: string
        }
        Insert: {
          category: string
          completed?: boolean
          created_at?: string
          feedback?: string | null
          id?: string
          score?: number | null
          transcript?: Json
          user_id: string
        }
        Update: {
          category?: string
          completed?: boolean
          created_at?: string
          feedback?: string | null
          id?: string
          score?: number | null
          transcript?: Json
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          branch: string | null
          cgpa: number | null
          college: string | null
          created_at: string
          degree: string | null
          full_name: string | null
          github_url: string | null
          headline: string | null
          id: string
          interests: string[]
          languages: string[]
          linkedin_url: string | null
          location: string | null
          onboarding_complete: boolean
          portfolio_url: string | null
          skills: string[]
          updated_at: string
          year: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          branch?: string | null
          cgpa?: number | null
          college?: string | null
          created_at?: string
          degree?: string | null
          full_name?: string | null
          github_url?: string | null
          headline?: string | null
          id: string
          interests?: string[]
          languages?: string[]
          linkedin_url?: string | null
          location?: string | null
          onboarding_complete?: boolean
          portfolio_url?: string | null
          skills?: string[]
          updated_at?: string
          year?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          branch?: string | null
          cgpa?: number | null
          college?: string | null
          created_at?: string
          degree?: string | null
          full_name?: string | null
          github_url?: string | null
          headline?: string | null
          id?: string
          interests?: string[]
          languages?: string[]
          linkedin_url?: string | null
          location?: string | null
          onboarding_complete?: boolean
          portfolio_url?: string | null
          skills?: string[]
          updated_at?: string
          year?: string | null
        }
        Relationships: []
      }
      resume_scores: {
        Row: {
          ats_score: number
          created_at: string
          formatting_score: number
          grammar_score: number
          id: string
          keyword_score: number
          missing_keywords: string[]
          missing_sections: string[]
          resume_id: string | null
          strengths: string[]
          suggestions: string[]
          summary: string | null
          user_id: string
        }
        Insert: {
          ats_score?: number
          created_at?: string
          formatting_score?: number
          grammar_score?: number
          id?: string
          keyword_score?: number
          missing_keywords?: string[]
          missing_sections?: string[]
          resume_id?: string | null
          strengths?: string[]
          suggestions?: string[]
          summary?: string | null
          user_id: string
        }
        Update: {
          ats_score?: number
          created_at?: string
          formatting_score?: number
          grammar_score?: number
          id?: string
          keyword_score?: number
          missing_keywords?: string[]
          missing_sections?: string[]
          resume_id?: string | null
          strengths?: string[]
          suggestions?: string[]
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resume_scores_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      resumes: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      roadmap_steps: {
        Row: {
          created_at: string
          description: string | null
          id: string
          resources: string[]
          status: string
          step_order: number
          target_career: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          resources?: string[]
          status?: string
          step_order?: number
          target_career?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          resources?: string[]
          status?: string
          step_order?: number
          target_career?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_internships: {
        Row: {
          created_at: string
          id: string
          internship_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          internship_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          internship_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_internships_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_settings: {
        Row: {
          email_notifications: boolean
          language: string
          profile_public: boolean
          push_notifications: boolean
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          email_notifications?: boolean
          language?: string
          profile_public?: boolean
          push_notifications?: boolean
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          email_notifications?: boolean
          language?: string
          profile_public?: boolean
          push_notifications?: boolean
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_skills: {
        Row: {
          category: string
          created_at: string
          id: string
          level: number
          name: string
          status: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          level?: number
          name: string
          status?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          level?: number
          name?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "mentor" | "admin"
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
      app_role: ["student", "mentor", "admin"],
    },
  },
} as const
