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
          info_id: string | null;
          is_important_info: boolean | null;
          label_name: string | null;
          label_name_id: string | null;
          name: string;
          name_id: string | null;
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
          info_id?: string | null;
          is_important_info?: boolean | null;
          label_name?: string | null;
          label_name_id?: string | null;
          name: string;
          name_id?: string | null;
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
          info_id?: string | null;
          is_important_info?: boolean | null;
          label_name?: string | null;
          label_name_id?: string | null;
          name?: string;
          name_id?: string | null;
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
      product: {
        Row: {
          banner_url: string | null;
          brand_image: string | null;
          catalogue: string | null;
          cover_color_hex: string | null;
          created_at: string | null;
          description_en: string | null;
          description_id: string | null;
          highlight_bottom_description_en: string | null;
          highlight_bottom_description_id: string | null;
          highlight_bottom_label_en: string | null;
          highlight_bottom_label_id: string | null;
          highlight_icon: string | null;
          highlight_section_description_en: string | null;
          highlight_section_description_id: string | null;
          highlight_section_image_url: string | null;
          highlight_top_description_en: string | null;
          highlight_top_description_id: string | null;
          highlight_top_label_en: string | null;
          highlight_top_label_id: string | null;
          id: string;
          is_highlight: boolean | null;
          is_highlight_section: boolean | null;
          is_profile_highlight: boolean | null;
          is_under_product: boolean;
          name: string;
          order: number;
          product_main_image: string | null;
          slug: string | null;
          suitables: Json | null;
          suitables_id: Json | null;
          title: string | null;
          type: string | null;
          updated_at: string | null;
        };
        Insert: {
          banner_url?: string | null;
          brand_image?: string | null;
          catalogue?: string | null;
          cover_color_hex?: string | null;
          created_at?: string | null;
          description_en?: string | null;
          description_id?: string | null;
          highlight_bottom_description_en?: string | null;
          highlight_bottom_description_id?: string | null;
          highlight_bottom_label_en?: string | null;
          highlight_bottom_label_id?: string | null;
          highlight_icon?: string | null;
          highlight_section_description_en?: string | null;
          highlight_section_description_id?: string | null;
          highlight_section_image_url?: string | null;
          highlight_top_description_en?: string | null;
          highlight_top_description_id?: string | null;
          highlight_top_label_en?: string | null;
          highlight_top_label_id?: string | null;
          id?: string;
          is_highlight?: boolean | null;
          is_highlight_section?: boolean | null;
          is_profile_highlight?: boolean | null;
          is_under_product?: boolean;
          name: string;
          order?: number;
          product_main_image?: string | null;
          slug?: string | null;
          suitables?: Json | null;
          suitables_id?: Json | null;
          title?: string | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          banner_url?: string | null;
          brand_image?: string | null;
          catalogue?: string | null;
          cover_color_hex?: string | null;
          created_at?: string | null;
          description_en?: string | null;
          description_id?: string | null;
          highlight_bottom_description_en?: string | null;
          highlight_bottom_description_id?: string | null;
          highlight_bottom_label_en?: string | null;
          highlight_bottom_label_id?: string | null;
          highlight_icon?: string | null;
          highlight_section_description_en?: string | null;
          highlight_section_description_id?: string | null;
          highlight_section_image_url?: string | null;
          highlight_top_description_en?: string | null;
          highlight_top_description_id?: string | null;
          highlight_top_label_en?: string | null;
          highlight_top_label_id?: string | null;
          id?: string;
          is_highlight?: boolean | null;
          is_highlight_section?: boolean | null;
          is_profile_highlight?: boolean | null;
          is_under_product?: boolean;
          name?: string;
          order?: number;
          product_main_image?: string | null;
          slug?: string | null;
          suitables?: Json | null;
          suitables_id?: Json | null;
          title?: string | null;
          type?: string | null;
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
      product_category: {
        Row: {
          created_at: string | null;
          id: string;
          name: string;
          order: number | null;
          product_id: string | null;
          product_profile_id: string | null;
          subtitle: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          name: string;
          order?: number | null;
          product_id?: string | null;
          product_profile_id?: string | null;
          subtitle?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          name?: string;
          order?: number | null;
          product_id?: string | null;
          product_profile_id?: string | null;
          subtitle?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_category_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "product";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_category_product_profile_id_fkey";
            columns: ["product_profile_id"];
            isOneToOne: false;
            referencedRelation: "product_profile";
            referencedColumns: ["id"];
          },
        ];
      };
      product_certificates: {
        Row: {
          certificate_id: string;
          created_at: string | null;
          id: string;
          product_id: string;
        };
        Insert: {
          certificate_id: string;
          created_at?: string | null;
          id?: string;
          product_id: string;
        };
        Update: {
          certificate_id?: string;
          created_at?: string | null;
          id?: string;
          product_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_certificates_certificate_id_fkey";
            columns: ["certificate_id"];
            isOneToOne: false;
            referencedRelation: "certificates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_certificates_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "product";
            referencedColumns: ["id"];
          },
        ];
      };
      product_item: {
        Row: {
          created_at: string | null;
          id: string;
          image: string | null;
          length: string | null;
          name: string;
          order: number | null;
          product_category_id: string | null;
          product_id: string;
          product_profile_id: string | null;
          spec_info: Json | null;
          updated_at: string | null;
          weight: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          image?: string | null;
          length?: string | null;
          name: string;
          order?: number | null;
          product_category_id?: string | null;
          product_id: string;
          product_profile_id?: string | null;
          spec_info?: Json | null;
          updated_at?: string | null;
          weight?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          image?: string | null;
          length?: string | null;
          name?: string;
          order?: number | null;
          product_category_id?: string | null;
          product_id?: string;
          product_profile_id?: string | null;
          spec_info?: Json | null;
          updated_at?: string | null;
          weight?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_item_product_category_id_fkey";
            columns: ["product_category_id"];
            isOneToOne: false;
            referencedRelation: "product_category";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_item_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "product";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_item_product_profile_id_fkey";
            columns: ["product_profile_id"];
            isOneToOne: false;
            referencedRelation: "product_profile";
            referencedColumns: ["id"];
          },
        ];
      };
      product_premium: {
        Row: {
          content_image_url: string | null;
          created_at: string | null;
          description_en: string | null;
          description_id: string | null;
          effective_size: string | null;
          id: string;
          material_fullname: string | null;
          material_name: string | null;
          premium_image_url: string | null;
          product_id: string;
          product_profile_id: string | null;
          reng_distance: string | null;
          size_per_panel: string | null;
          updated_at: string | null;
        };
        Insert: {
          content_image_url?: string | null;
          created_at?: string | null;
          description_en?: string | null;
          description_id?: string | null;
          effective_size?: string | null;
          id?: string;
          material_fullname?: string | null;
          material_name?: string | null;
          premium_image_url?: string | null;
          product_id: string;
          product_profile_id?: string | null;
          reng_distance?: string | null;
          size_per_panel?: string | null;
          updated_at?: string | null;
        };
        Update: {
          content_image_url?: string | null;
          created_at?: string | null;
          description_en?: string | null;
          description_id?: string | null;
          effective_size?: string | null;
          id?: string;
          material_fullname?: string | null;
          material_name?: string | null;
          premium_image_url?: string | null;
          product_id?: string;
          product_profile_id?: string | null;
          reng_distance?: string | null;
          size_per_panel?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_premium_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: true;
            referencedRelation: "product";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_premium_product_profile_id_fkey";
            columns: ["product_profile_id"];
            isOneToOne: false;
            referencedRelation: "product_profile";
            referencedColumns: ["id"];
          },
        ];
      };
      product_profile: {
        Row: {
          created_at: string | null;
          effective_size: string | null;
          id: string;
          materials: string | null;
          name: string;
          order: number | null;
          panel_amount: number | null;
          product_id: string;
          profile_banner_url: string | null;
          profile_image_url: string | null;
          size: Json | null;
          size_per_panel: string | null;
          specification: Json | null;
          thickness: string | null;
          tkdn_value: string | null;
          updated_at: string | null;
          weight: string | null;
        };
        Insert: {
          created_at?: string | null;
          effective_size?: string | null;
          id?: string;
          materials?: string | null;
          name: string;
          order?: number | null;
          panel_amount?: number | null;
          product_id: string;
          profile_banner_url?: string | null;
          profile_image_url?: string | null;
          size?: Json | null;
          size_per_panel?: string | null;
          specification?: Json | null;
          thickness?: string | null;
          tkdn_value?: string | null;
          updated_at?: string | null;
          weight?: string | null;
        };
        Update: {
          created_at?: string | null;
          effective_size?: string | null;
          id?: string;
          materials?: string | null;
          name?: string;
          order?: number | null;
          panel_amount?: number | null;
          product_id?: string;
          profile_banner_url?: string | null;
          profile_image_url?: string | null;
          size?: Json | null;
          size_per_panel?: string | null;
          specification?: Json | null;
          thickness?: string | null;
          tkdn_value?: string | null;
          updated_at?: string | null;
          weight?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "product_profile_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "product";
            referencedColumns: ["id"];
          },
        ];
      };
      product_profile_badges: {
        Row: {
          badge_id: string;
          created_at: string | null;
          id: string;
          product_profile_id: string;
        };
        Insert: {
          badge_id: string;
          created_at?: string | null;
          id?: string;
          product_profile_id: string;
        };
        Update: {
          badge_id?: string;
          created_at?: string | null;
          id?: string;
          product_profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_profile_badges_badge_id_fkey";
            columns: ["badge_id"];
            isOneToOne: false;
            referencedRelation: "product_badges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_profile_badges_product_profile_id_fkey";
            columns: ["product_profile_id"];
            isOneToOne: false;
            referencedRelation: "product_profile";
            referencedColumns: ["id"];
          },
        ];
      };
      product_profile_certificates: {
        Row: {
          certificate_id: string;
          created_at: string | null;
          id: string;
          product_profile_id: string;
        };
        Insert: {
          certificate_id: string;
          created_at?: string | null;
          id?: string;
          product_profile_id: string;
        };
        Update: {
          certificate_id?: string;
          created_at?: string | null;
          id?: string;
          product_profile_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_profile_certificates_certificate_id_fkey";
            columns: ["certificate_id"];
            isOneToOne: false;
            referencedRelation: "certificates";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_profile_certificates_product_profile_id_fkey";
            columns: ["product_profile_id"];
            isOneToOne: false;
            referencedRelation: "product_profile";
            referencedColumns: ["id"];
          },
        ];
      };
      project_categories: {
        Row: {
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          name: string;
          order: number | null;
          slug: string;
          thumbnail: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          name: string;
          order?: number | null;
          slug: string;
          thumbnail?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          name?: string;
          order?: number | null;
          slug?: string;
          thumbnail?: string | null;
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
          menu_permission: Json | null;
          name: string | null;
          password: string | null;
          role: number;
          token: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: number;
          menu_permission?: Json | null;
          name?: string | null;
          password?: string | null;
          role?: number;
          token?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: number;
          menu_permission?: Json | null;
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
