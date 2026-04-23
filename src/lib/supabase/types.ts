export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          business_name: string
          display_name: string | null
          status: 'prospect' | 'negotiation' | 'trial' | 'active' | 'paused' | 'terminated' | 'management'
          industry: string
          business_age_years: number | null
          primary_contact_name: string | null
          primary_contact_email: string | null
          primary_contact_phone: string | null
          website_url: string | null
          notes: string | null
          metricool_brand_id: number | null
          metricool_brand_name: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          business_name: string
          display_name?: string | null
          status?: 'prospect' | 'negotiation' | 'trial' | 'active' | 'paused' | 'terminated' | 'management'
          industry: string
          business_age_years?: number | null
          primary_contact_name?: string | null
          primary_contact_email?: string | null
          primary_contact_phone?: string | null
          website_url?: string | null
          notes?: string | null
          metricool_brand_id?: number | null
          metricool_brand_name?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          business_name?: string
          display_name?: string | null
          status?: 'prospect' | 'negotiation' | 'trial' | 'active' | 'paused' | 'terminated' | 'management'
          industry?: string
          business_age_years?: number | null
          primary_contact_name?: string | null
          primary_contact_email?: string | null
          primary_contact_phone?: string | null
          website_url?: string | null
          notes?: string | null
          metricool_brand_id?: number | null
          metricool_brand_name?: string | null
        }
      }
      fee_structures: {
        Row: {
          id: string
          client_id: string
          created_at: string
          updated_at: string
          baseline_method: 'trailing12' | 'trailing6' | 'custom'
          custom_baseline: number | null
          industry_growth_factor: number
          maturity_buffer: number
          monthly_cap: number | null
          annual_cap: number | null
          trial_end_date: string | null
          effective_date: string
        }
        Insert: {
          id?: string
          client_id: string
          created_at?: string
          updated_at?: string
          baseline_method?: 'trailing12' | 'trailing6' | 'custom'
          custom_baseline?: number | null
          industry_growth_factor?: number
          maturity_buffer?: number
          monthly_cap?: number | null
          annual_cap?: number | null
          trial_end_date?: string | null
          effective_date?: string
        }
        Update: {
          id?: string
          client_id?: string
          created_at?: string
          updated_at?: string
          baseline_method?: 'trailing12' | 'trailing6' | 'custom'
          custom_baseline?: number | null
          industry_growth_factor?: number
          maturity_buffer?: number
          monthly_cap?: number | null
          annual_cap?: number | null
          trial_end_date?: string | null
          effective_date?: string
        }
      }
      fee_tiers: {
        Row: {
          id: string
          fee_structure_id: string
          tier_order: number
          min_amount: number
          max_amount: number | null
          percentage: number
        }
        Insert: {
          id?: string
          fee_structure_id: string
          tier_order: number
          min_amount: number
          max_amount?: number | null
          percentage: number
        }
        Update: {
          id?: string
          fee_structure_id?: string
          tier_order?: number
          min_amount?: number
          max_amount?: number | null
          percentage?: number
        }
      }
      trailing_revenue: {
        Row: {
          id: string
          client_id: string
          year: number
          month: number
          revenue: number
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          year: number
          month: number
          revenue: number
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          year?: number
          month?: number
          revenue?: number
          created_at?: string
        }
      }
      monthly_revenue: {
        Row: {
          id: string
          client_id: string
          year: number
          month: number
          gross_revenue: number
          job_count: number | null
          attributed_revenue: number
          organic_revenue: number
          referral_revenue: number
          unknown_revenue: number
          calculated_baseline: number
          calculated_uplift: number
          calculated_fee: number
          fee_breakdown: Json | null
          verified: boolean
          verification_date: string | null
          verified_by: string | null
          notes: string | null
          payment_status: 'pending' | 'invoiced' | 'paid' | 'overdue'
          payment_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          year: number
          month: number
          gross_revenue: number
          job_count?: number | null
          attributed_revenue?: number
          organic_revenue?: number
          referral_revenue?: number
          unknown_revenue?: number
          calculated_baseline?: number
          calculated_uplift?: number
          calculated_fee?: number
          fee_breakdown?: Json | null
          verified?: boolean
          verification_date?: string | null
          verified_by?: string | null
          notes?: string | null
          payment_status?: 'pending' | 'invoiced' | 'paid' | 'overdue'
          payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          year?: number
          month?: number
          gross_revenue?: number
          job_count?: number | null
          attributed_revenue?: number
          organic_revenue?: number
          referral_revenue?: number
          unknown_revenue?: number
          calculated_baseline?: number
          calculated_uplift?: number
          calculated_fee?: number
          fee_breakdown?: Json | null
          verified?: boolean
          verification_date?: string | null
          verified_by?: string | null
          notes?: string | null
          payment_status?: 'pending' | 'invoiced' | 'paid' | 'overdue'
          payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      internal_payouts: {
        Row: {
          id: string
          monthly_revenue_id: string
          total_fee: number
          business_amount: number
          sales_amount: number
          worker_amount: number
          sales_person: string | null
          worker_person: string | null
          payout_date: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          monthly_revenue_id: string
          total_fee: number
          business_amount: number
          sales_amount: number
          worker_amount: number
          sales_person?: string | null
          worker_person?: string | null
          payout_date?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          monthly_revenue_id?: string
          total_fee?: number
          business_amount?: number
          sales_amount?: number
          worker_amount?: number
          sales_person?: string | null
          worker_person?: string | null
          payout_date?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      lead_sources: {
        Row: {
          id: string
          client_id: string
          name: string
          source_type: 'sweetDreams' | 'organic' | 'referral' | 'unknown'
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          source_type: 'sweetDreams' | 'organic' | 'referral' | 'unknown'
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          source_type?: 'sweetDreams' | 'organic' | 'referral' | 'unknown'
          is_active?: boolean
          created_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          client_id: string
          lead_source_id: string | null
          created_at: string
          updated_at: string
          contact_name: string | null
          contact_phone: string | null
          contact_email: string | null
          source_type: 'sweetDreams' | 'organic' | 'referral' | 'unknown'
          confidence_level: 'confirmed' | 'likely' | 'assumed' | 'unknown'
          status: 'new' | 'contacted' | 'qualified' | 'quoted' | 'won' | 'lost'
          estimated_value: number | null
          final_value: number | null
          won_date: string | null
          lost_reason: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          client_id: string
          lead_source_id?: string | null
          created_at?: string
          updated_at?: string
          contact_name?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          source_type?: 'sweetDreams' | 'organic' | 'referral' | 'unknown'
          confidence_level?: 'confirmed' | 'likely' | 'assumed' | 'unknown'
          status?: 'new' | 'contacted' | 'qualified' | 'quoted' | 'won' | 'lost'
          estimated_value?: number | null
          final_value?: number | null
          won_date?: string | null
          lost_reason?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          lead_source_id?: string | null
          created_at?: string
          updated_at?: string
          contact_name?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          source_type?: 'sweetDreams' | 'organic' | 'referral' | 'unknown'
          confidence_level?: 'confirmed' | 'likely' | 'assumed' | 'unknown'
          status?: 'new' | 'contacted' | 'qualified' | 'quoted' | 'won' | 'lost'
          estimated_value?: number | null
          final_value?: number | null
          won_date?: string | null
          lost_reason?: string | null
          notes?: string | null
        }
      }
      daily_metrics: {
        Row: {
          id: string
          client_id: string
          date: string
          platform: string
          metric_type: string
          value: number
          raw_data: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          date: string
          platform: string
          metric_type: string
          value: number
          raw_data?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          date?: string
          platform?: string
          metric_type?: string
          value?: number
          raw_data?: Json | null
          created_at?: string
        }
      }
      monthly_analytics: {
        Row: {
          id: string
          client_id: string
          year: number
          month: number
          platform: string
          followers: number | null
          follower_change: number | null
          posts_published: number | null
          reach: number | null
          impressions: number | null
          engagements: number | null
          engagement_rate: number | null
          website_sessions: number | null
          website_users: number | null
          page_views: number | null
          avg_session_duration: number | null
          bounce_rate: number | null
          search_impressions: number | null
          search_clicks: number | null
          search_ctr: number | null
          avg_position: number | null
          gbp_views: number | null
          gbp_searches: number | null
          gbp_calls: number | null
          gbp_directions: number | null
          top_content: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          year: number
          month: number
          platform: string
          followers?: number | null
          follower_change?: number | null
          posts_published?: number | null
          reach?: number | null
          impressions?: number | null
          engagements?: number | null
          engagement_rate?: number | null
          website_sessions?: number | null
          website_users?: number | null
          page_views?: number | null
          avg_session_duration?: number | null
          bounce_rate?: number | null
          search_impressions?: number | null
          search_clicks?: number | null
          search_ctr?: number | null
          avg_position?: number | null
          gbp_views?: number | null
          gbp_searches?: number | null
          gbp_calls?: number | null
          gbp_directions?: number | null
          top_content?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          year?: number
          month?: number
          platform?: string
          followers?: number | null
          follower_change?: number | null
          posts_published?: number | null
          reach?: number | null
          impressions?: number | null
          engagements?: number | null
          engagement_rate?: number | null
          website_sessions?: number | null
          website_users?: number | null
          page_views?: number | null
          avg_session_duration?: number | null
          bounce_rate?: number | null
          search_impressions?: number | null
          search_clicks?: number | null
          search_ctr?: number | null
          avg_position?: number | null
          gbp_views?: number | null
          gbp_searches?: number | null
          gbp_calls?: number | null
          gbp_directions?: number | null
          top_content?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      activity_log: {
        Row: {
          id: string
          client_id: string
          date: string
          activity_type: string
          description: string | null
          quantity: number | null
          hours: number | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          date: string
          activity_type: string
          description?: string | null
          quantity?: number | null
          hours?: number | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          date?: string
          activity_type?: string
          description?: string | null
          quantity?: number | null
          hours?: number | null
          created_by?: string | null
          created_at?: string
        }
      }
      monthly_activity: {
        Row: {
          id: string
          client_id: string
          year: number
          month: number
          total_hours: number
          content_pieces: number
          social_posts: number
          emails_sent: number
          meetings_held: number
          other_activities: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          year: number
          month: number
          total_hours?: number
          content_pieces?: number
          social_posts?: number
          emails_sent?: number
          meetings_held?: number
          other_activities?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          year?: number
          month?: number
          total_hours?: number
          content_pieces?: number
          social_posts?: number
          emails_sent?: number
          meetings_held?: number
          other_activities?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      integrations: {
        Row: {
          id: string
          client_id: string
          platform: string
          external_id: string | null
          access_token: string | null
          refresh_token: string | null
          token_expires_at: string | null
          connection_status: 'connected' | 'disconnected' | 'error'
          last_sync_at: string | null
          last_error: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          platform: string
          external_id?: string | null
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          connection_status?: 'connected' | 'disconnected' | 'error'
          last_sync_at?: string | null
          last_error?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          platform?: string
          external_id?: string | null
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          connection_status?: 'connected' | 'disconnected' | 'error'
          last_sync_at?: string | null
          last_error?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          client_id: string
          alert_type: string
          severity: 'info' | 'warning' | 'critical'
          title: string
          message: string
          acknowledged: boolean
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          alert_type: string
          severity?: 'info' | 'warning' | 'critical'
          title: string
          message: string
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          alert_type?: string
          severity?: 'info' | 'warning' | 'critical'
          title?: string
          message?: string
          acknowledged?: boolean
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
        }
      }
      drive_links: {
        Row: {
          id: string
          client_id: string
          name: string
          url: string
          file_type: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          url: string
          file_type?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          url?: string
          file_type?: string | null
          created_at?: string
        }
      }
      saved_scenarios: {
        Row: {
          id: string
          name: string
          business_name: string
          industry: string
          monthly_revenue: number
          growth_rate: number
          baseline: number
          tiers: Json
          projections: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          business_name: string
          industry: string
          monthly_revenue: number
          growth_rate: number
          baseline: number
          tiers: Json
          projections: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          business_name?: string
          industry?: string
          monthly_revenue?: number
          growth_rate?: number
          baseline?: number
          tiers?: Json
          projections?: Json
          created_at?: string
          updated_at?: string
        }
      }
      payout_records: {
        Row: {
          id: string
          created_at: string
          deal_type: string
          client_name: string
          client_id: string | null
          date: string
          total_revenue: number
          business_amount: number
          sales_amount: number
          worker_amount: number
          sales_person: string | null
          worker_person: string | null
          tier_used: string | null
          calculation_details: Json | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          deal_type: string
          client_name: string
          client_id?: string | null
          date: string
          total_revenue: number
          business_amount: number
          sales_amount: number
          worker_amount: number
          sales_person?: string | null
          worker_person?: string | null
          tier_used?: string | null
          calculation_details?: Json | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          deal_type?: string
          client_name?: string
          client_id?: string | null
          date?: string
          total_revenue?: number
          business_amount?: number
          sales_amount?: number
          worker_amount?: number
          sales_person?: string | null
          worker_person?: string | null
          tier_used?: string | null
          calculation_details?: Json | null
          notes?: string | null
        }
      }
      payout_transactions: {
        Row: {
          id: string
          payout_record_id: string
          created_at: string
          transaction_type: 'deposit_received' | 'payment_to_sales' | 'payment_to_worker' | 'payment_to_business'
          amount: number
          recipient: string | null
          description: string | null
          date: string
        }
        Insert: {
          id?: string
          payout_record_id: string
          created_at?: string
          transaction_type: 'deposit_received' | 'payment_to_sales' | 'payment_to_worker' | 'payment_to_business'
          amount: number
          recipient?: string | null
          description?: string | null
          date: string
        }
        Update: {
          id?: string
          payout_record_id?: string
          created_at?: string
          transaction_type?: 'deposit_received' | 'payment_to_sales' | 'payment_to_worker' | 'payment_to_business'
          amount?: number
          recipient?: string | null
          description?: string | null
          date?: string
        }
      }
      contract_files: {
        Row: {
          id: string
          payout_record_id: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          uploaded_at: string
          notes: string | null
        }
        Insert: {
          id?: string
          payout_record_id: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          uploaded_at?: string
          notes?: string | null
        }
        Update: {
          id?: string
          payout_record_id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          uploaded_at?: string
          notes?: string | null
        }
      }
      admins: {
        Row: {
          id: string
          email: string
          role: 'super_admin' | 'admin' | 'viewer'
          invited_by: string | null
          invited_at: string
          last_login_at: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: 'super_admin' | 'admin' | 'viewer'
          invited_by?: string | null
          invited_at?: string
          last_login_at?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'super_admin' | 'admin' | 'viewer'
          invited_by?: string | null
          invited_at?: string
          last_login_at?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      studio_sessions: {
        Row: {
          id: string
          engineer: string
          session_type: 'recording' | 'media'
          studio: 'studio_a' | 'studio_b' | null
          hours: number | null
          is_block: boolean
          media_service_type: string | null
          media_role: 'produced' | 'upsold' | null
          client_name: string
          session_date: string
          total_charge: number
          engineer_payout: number
          studio_payout: number
          bank_entity: 'sweet_dreams_music' | 'sweet_dreams_us'
          status: 'pending' | 'approved' | 'paid'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          engineer: string
          session_type: 'recording' | 'media'
          studio?: 'studio_a' | 'studio_b' | null
          hours?: number | null
          is_block?: boolean
          media_service_type?: string | null
          media_role?: 'produced' | 'upsold' | null
          client_name: string
          session_date: string
          total_charge: number
          engineer_payout: number
          studio_payout: number
          bank_entity: 'sweet_dreams_music' | 'sweet_dreams_us'
          status?: 'pending' | 'approved' | 'paid'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          engineer?: string
          session_type?: 'recording' | 'media'
          studio?: 'studio_a' | 'studio_b' | null
          hours?: number | null
          is_block?: boolean
          media_service_type?: string | null
          media_role?: 'produced' | 'upsold' | null
          client_name?: string
          session_date?: string
          total_charge?: number
          engineer_payout?: number
          studio_payout?: number
          bank_entity?: 'sweet_dreams_music' | 'sweet_dreams_us'
          status?: 'pending' | 'approved' | 'paid'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      revenue_entries: {
        Row: {
          id: string
          client_id: string
          date: string
          category: string
          amount: number
          quantity: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          date: string
          category: string
          amount: number
          quantity?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          date?: string
          category?: string
          amount?: number
          quantity?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      monthly_expenses: {
        Row: {
          id: string
          client_id: string
          year: number
          month: number
          category: string
          label: string
          amount: number
          is_recurring: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id: string
          year: number
          month: number
          category: string
          label: string
          amount?: number
          is_recurring?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          year?: number
          month?: number
          category?: string
          label?: string
          amount?: number
          is_recurring?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      content_items: {
        Row: {
          id: string
          client_id: string | null
          title: string
          description: string | null
          content_type: 'video' | 'reel' | 'post' | 'story' | 'blog' | 'photo' | 'carousel'
          status: 'idea' | 'filming' | 'editing' | 'review' | 'scheduled' | 'posted' | 'analyzed'
          scheduled_date: string | null
          posted_date: string | null
          platforms: Json
          raw_file_url: string | null
          final_file_url: string | null
          thumbnail_url: string | null
          assigned_to: string | null
          analytics: Json
          ai_generated: boolean
          ai_prompt: string | null
          tags: string[]
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          title: string
          description?: string | null
          content_type: 'video' | 'reel' | 'post' | 'story' | 'blog' | 'photo' | 'carousel'
          status?: 'idea' | 'filming' | 'editing' | 'review' | 'scheduled' | 'posted' | 'analyzed'
          scheduled_date?: string | null
          posted_date?: string | null
          platforms?: Json
          raw_file_url?: string | null
          final_file_url?: string | null
          thumbnail_url?: string | null
          assigned_to?: string | null
          analytics?: Json
          ai_generated?: boolean
          ai_prompt?: string | null
          tags?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          title?: string
          description?: string | null
          content_type?: 'video' | 'reel' | 'post' | 'story' | 'blog' | 'photo' | 'carousel'
          status?: 'idea' | 'filming' | 'editing' | 'review' | 'scheduled' | 'posted' | 'analyzed'
          scheduled_date?: string | null
          posted_date?: string | null
          platforms?: Json
          raw_file_url?: string | null
          final_file_url?: string | null
          thumbnail_url?: string | null
          assigned_to?: string | null
          analytics?: Json
          ai_generated?: boolean
          ai_prompt?: string | null
          tags?: string[]
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      content_ideas: {
        Row: {
          id: string
          client_id: string | null
          title: string
          concept: string | null
          inspiration_source: string | null
          based_on_content_id: string | null
          score: number | null
          status: 'new' | 'approved' | 'rejected' | 'converted'
          converted_to: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          title: string
          concept?: string | null
          inspiration_source?: string | null
          based_on_content_id?: string | null
          score?: number | null
          status?: 'new' | 'approved' | 'rejected' | 'converted'
          converted_to?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          title?: string
          concept?: string | null
          inspiration_source?: string | null
          based_on_content_id?: string | null
          score?: number | null
          status?: 'new' | 'approved' | 'rejected' | 'converted'
          converted_to?: string | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_email: string
          type: 'booking' | 'payment' | 'milestone' | 'content' | 'system'
          title: string
          body: string | null
          link: string | null
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_email: string
          type: 'booking' | 'payment' | 'milestone' | 'content' | 'system'
          title: string
          body?: string | null
          link?: string | null
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_email?: string
          type?: 'booking' | 'payment' | 'milestone' | 'content' | 'system'
          title?: string
          body?: string | null
          link?: string | null
          read?: boolean
          created_at?: string
        }
      }
      client_engines: {
        Row: {
          id: string
          client_id: string
          engine: 'content' | 'brand_assets' | 'social_management' | 'web_dev' | 'offer_refinement' | 'fluid_communication'
          status: 'inactive' | 'setup' | 'active' | 'paused'
          notes: string | null
          activated_at: string | null
        }
        Insert: {
          id?: string
          client_id: string
          engine: 'content' | 'brand_assets' | 'social_management' | 'web_dev' | 'offer_refinement' | 'fluid_communication'
          status?: 'inactive' | 'setup' | 'active' | 'paused'
          notes?: string | null
          activated_at?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          engine?: 'content' | 'brand_assets' | 'social_management' | 'web_dev' | 'offer_refinement' | 'fluid_communication'
          status?: 'inactive' | 'setup' | 'active' | 'paused'
          notes?: string | null
          activated_at?: string | null
        }
      }
      grand_slam_worksheets: {
        Row: {
          id: string
          client_id: string | null
          dream_outcome: string | null
          likelihood_score: number | null
          time_to_result: string | null
          time_delay_score: number | null
          effort_required: string | null
          effort_score: number | null
          value_stack: Json
          proposed_price: number | null
          engines_active: Json
          notes: string | null
          status: 'draft' | 'presented' | 'accepted' | 'declined'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_id?: string | null
          dream_outcome?: string | null
          likelihood_score?: number | null
          time_to_result?: string | null
          time_delay_score?: number | null
          effort_required?: string | null
          effort_score?: number | null
          value_stack?: Json
          proposed_price?: number | null
          engines_active?: Json
          notes?: string | null
          status?: 'draft' | 'presented' | 'accepted' | 'declined'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_id?: string | null
          dream_outcome?: string | null
          likelihood_score?: number | null
          time_to_result?: string | null
          time_delay_score?: number | null
          effort_required?: string | null
          effort_score?: number | null
          value_stack?: Json
          proposed_price?: number | null
          engines_active?: Json
          notes?: string | null
          status?: 'draft' | 'presented' | 'accepted' | 'declined'
          created_at?: string
          updated_at?: string
        }
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
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience exports
export type Client = Tables<'clients'>
export type FeeStructure = Tables<'fee_structures'>
export type FeeTier = Tables<'fee_tiers'>
export type TrailingRevenue = Tables<'trailing_revenue'>
export type MonthlyRevenue = Tables<'monthly_revenue'>
export type InternalPayout = Tables<'internal_payouts'>
export type LeadSource = Tables<'lead_sources'>
export type Lead = Tables<'leads'>
export type DailyMetric = Tables<'daily_metrics'>
export type MonthlyAnalytic = Tables<'monthly_analytics'>
export type ActivityLogEntry = Tables<'activity_log'>
export type MonthlyActivity = Tables<'monthly_activity'>
export type Integration = Tables<'integrations'>
export type Alert = Tables<'alerts'>
export type DriveLink = Tables<'drive_links'>
export type SavedScenario = Tables<'saved_scenarios'>
export type PayoutRecord = Tables<'payout_records'>
export type PayoutTransaction = Tables<'payout_transactions'>
export type ContractFile = Tables<'contract_files'>
export type Admin = Tables<'admins'>
export type StudioSession = Tables<'studio_sessions'>
export type StudioSessionInsert = InsertTables<'studio_sessions'>
export type StudioSessionUpdate = UpdateTables<'studio_sessions'>
export type RevenueEntry = Tables<'revenue_entries'>
export type RevenueEntryInsert = InsertTables<'revenue_entries'>
export type RevenueEntryUpdate = UpdateTables<'revenue_entries'>
export type MonthlyExpense = Tables<'monthly_expenses'>
export type MonthlyExpenseInsert = InsertTables<'monthly_expenses'>
export type MonthlyExpenseUpdate = UpdateTables<'monthly_expenses'>
export type ContentItem = Tables<'content_items'>
export type ContentIdea = Tables<'content_ideas'>
export type Notification = Tables<'notifications'>
export type ClientEngine = Tables<'client_engines'>
export type GrandSlamWorksheet = Tables<'grand_slam_worksheets'>
