export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
      articles: {
        Row: {
          content: string | null;
          cover_image: string | null;
          created_at: string;
          excerpt: string | null;
          id: string;
          publish: boolean | null;
          seo_description: string | null;
          seo_title: string | null;
          slug: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          content?: string | null;
          cover_image?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          publish?: boolean | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          content?: string | null;
          cover_image?: string | null;
          created_at?: string;
          excerpt?: string | null;
          id?: string;
          publish?: boolean | null;
          seo_description?: string | null;
          seo_title?: string | null;
          slug?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      certificates: {
        Row: {
          created_at: string | null;
          description_en: string;
          description_id: string;
          file_url: string;
          filename: string;
          id: string;
          image: string | null;
          info: string;
          is_important_info: boolean | null;
          label_name: string | null;
          name: string;
          order: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description_en: string;
          description_id: string;
          file_url: string;
          filename: string;
          id?: string;
          image?: string | null;
          info: string;
          is_important_info?: boolean | null;
          label_name?: string | null;
          name: string;
          order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description_en?: string;
          description_id?: string;
          file_url?: string;
          filename?: string;
          id?: string;
          image?: string | null;
          info?: string;
          is_important_info?: boolean | null;
          label_name?: string | null;
          name?: string;
          order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      company_profile: {
        Row: {
          file_size: number;
          file_url: string;
          filename: string;
          id: string;
          updated_at: string | null;
          uploaded_at: string | null;
        };
        Insert: {
          file_size: number;
          file_url: string;
          filename: string;
          id?: string;
          updated_at?: string | null;
          uploaded_at?: string | null;
        };
        Update: {
          file_size?: number;
          file_url?: string;
          filename?: string;
          id?: string;
          updated_at?: string | null;
          uploaded_at?: string | null;
        };
        Relationships: [];
      };
      "contacts-location": {
        Row: {
          created_at: string | null;
          data_type: string | null;
          id: string;
          type: string;
          updated_at: string | null;
          value: string;
        };
        Insert: {
          created_at?: string | null;
          data_type?: string | null;
          id?: string;
          type: string;
          updated_at?: string | null;
          value: string;
        };
        Update: {
          created_at?: string | null;
          data_type?: string | null;
          id?: string;
          type?: string;
          updated_at?: string | null;
          value?: string;
        };
        Relationships: [];
      };
      cover: {
        Row: {
          created_at: string | null;
          id: string;
          image: string;
          order: number;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          image: string;
          order?: number;
          type: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          image?: string;
          order?: number;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      product_badges: {
        Row: {
          created_at: string | null;
          id: string;
          image: string;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          image: string;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          image?: string;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      project_categories: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          name: string;
          order: number | null;
          slug: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          name: string;
          order?: number | null;
          slug: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          order?: number | null;
          slug?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      project_category_relations: {
        Row: {
          category_id: string;
          created_at: string | null;
          id: string;
          project_id: string;
        };
        Insert: {
          category_id: string;
          created_at?: string | null;
          id?: string;
          project_id: string;
        };
        Update: {
          category_id?: string;
          created_at?: string | null;
          id?: string;
          project_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "project_category_relations_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "project_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "project_category_relations_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      project_images: {
        Row: {
          created_at: string | null;
          id: string;
          image_url: string;
          is_highlight: boolean | null;
          order: number;
          project_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          image_url: string;
          is_highlight?: boolean | null;
          order?: number;
          project_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          image_url?: string;
          is_highlight?: boolean | null;
          order?: number;
          project_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "project_images_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      projects: {
        Row: {
          category_id: string;
          created_at: string | null;
          id: string;
          location_link: string;
          location_text: string;
          name: string;
          order: number;
          roof_type: string;
          slug: string | null;
          updated_at: string | null;
        };
        Insert: {
          category_id: string;
          created_at?: string | null;
          id?: string;
          location_link: string;
          location_text: string;
          name: string;
          order?: number;
          roof_type: string;
          slug?: string | null;
          updated_at?: string | null;
        };
        Update: {
          category_id?: string;
          created_at?: string | null;
          id?: string;
          location_link?: string;
          location_text?: string;
          name?: string;
          order?: number;
          roof_type?: string;
          slug?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "projects_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "project_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      slider: {
        Row: {
          created_at: string | null;
          description_en: string;
          description_id: string;
          id: string;
          image: string;
          link: string | null;
          link_text: string | null;
          order: number;
          title_en: string;
          title_id: string;
          type: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description_en: string;
          description_id: string;
          id?: string;
          image: string;
          link?: string | null;
          link_text?: string | null;
          order?: number;
          title_en: string;
          title_id: string;
          type?: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description_en?: string;
          description_id?: string;
          id?: string;
          image?: string;
          link?: string | null;
          link_text?: string | null;
          order?: number;
          title_en?: string;
          title_id?: string;
          type?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      user: {
        Row: {
          created_at: string;
          email: string | null;
          id: number;
          name: string | null;
          password: string | null;
          role: number;
          token: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: number;
          name?: string | null;
          password?: string | null;
          role?: number;
          token?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: number;
          name?: string | null;
          password?: string | null;
          role?: number;
          token?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
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
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
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
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
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
    Enums: {},
  },
} as const;
