export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: { id: number; name: string }
        Insert: { id?: number; name: string }
        Update: { id?: number; name?: string }
        Relationships: []
      }
      grades: {
        Row: { display_order: number | null; id: number; name: string }
        Insert: { display_order?: number | null; id?: number; name: string }
        Update: { display_order?: number | null; id?: number; name?: string }
        Relationships: []
      }
      inventions: {
        Row: {
          category_id: number | null
          created_at: string | null
          curriculum: string | null
          detailed_summary: string | null
          drawing_url: string | null
          error: string | null
          grade_id: number | null
          id: string
          invention_motive: string | null
          ipc: string | null
          keyword: string | null
          next_step: string | null
          number: number
          original_title: string
          problem: string | null
          problem_tag: string | null
          scamper: string | null
          sdg: string | null
          simple_summary: string | null
          simple_title: string
          solution: string | null
        }
        Insert: {
          category_id?: number | null
          created_at?: string | null
          curriculum?: string | null
          detailed_summary?: string | null
          drawing_url?: string | null
          error?: string | null
          grade_id?: number | null
          id: string
          invention_motive?: string | null
          ipc?: string | null
          keyword?: string | null
          next_step?: string | null
          number: number
          original_title: string
          problem?: string | null
          problem_tag?: string | null
          scamper?: string | null
          sdg?: string | null
          simple_summary?: string | null
          simple_title: string
          solution?: string | null
        }
        Update: {
          category_id?: number | null
          created_at?: string | null
          curriculum?: string | null
          detailed_summary?: string | null
          drawing_url?: string | null
          error?: string | null
          grade_id?: number | null
          id?: string
          invention_motive?: string | null
          ipc?: string | null
          keyword?: string | null
          next_step?: string | null
          number?: number
          original_title?: string
          problem?: string | null
          problem_tag?: string | null
          scamper?: string | null
          sdg?: string | null
          simple_summary?: string | null
          simple_title?: string
          solution?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventions_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          }
        ]
      }
      partner_organizations: {
        Row: {
          id: string
          name: string
          org_type: string
          region: string | null
          contact_name: string | null
          contact_email: string | null
          contact_phone: string | null
          max_seats: number | null
          is_active: boolean | null
          partnership_start: string | null
          partnership_end: string | null
          notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          org_type?: string
          region?: string | null
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          max_seats?: number | null
          is_active?: boolean | null
          partnership_start?: string | null
          partnership_end?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          org_type?: string
          region?: string | null
          contact_name?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          max_seats?: number | null
          is_active?: boolean | null
          partnership_start?: string | null
          partnership_end?: string | null
          notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      access_codes: {
        Row: {
          id: string
          code: string
          organization_id: string
          label: string | null
          is_active: boolean | null
          usage_count: number | null
          max_usage: number | null
          expires_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          code: string
          organization_id: string
          label?: string | null
          is_active?: boolean | null
          usage_count?: number | null
          max_usage?: number | null
          expires_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          code?: string
          organization_id?: string
          label?: string | null
          is_active?: boolean | null
          usage_count?: number | null
          max_usage?: number | null
          expires_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "access_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "partner_organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      partnership_inquiries: {
        Row: {
          id: string
          org_name: string
          contact_name: string
          contact_email: string
          contact_phone: string | null
          purpose: string
          student_count: number | null
          message: string | null
          status: string | null
          admin_notes: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          org_name: string
          contact_name: string
          contact_email: string
          contact_phone?: string | null
          purpose: string
          student_count?: number | null
          message?: string | null
          status?: string | null
          admin_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          org_name?: string
          contact_name?: string
          contact_email?: string
          contact_phone?: string | null
          purpose?: string
          student_count?: number | null
          message?: string | null
          status?: string | null
          admin_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
