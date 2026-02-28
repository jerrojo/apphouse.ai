// =============================================================================
// packages/supabase-client/src/types.ts
// auto-generate with: npx supabase gen types typescript --project-id <id> > src/types.ts
// this is a placeholder until the real schema is generated
// =============================================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      apps: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          domain: string | null;
          status: 'draft' | 'cooking' | 'live' | 'paused' | 'archived';
          platforms: 'web' | 'mobile' | 'full';
          icon_url: string | null;
          cover_url: string | null;
          vibe: 'minimal' | 'playful' | 'corporate' | 'premium' | 'bold';
          revenue_model: 'free' | 'freemium' | 'subscription' | 'pay_per_use' | 'ads' | 'one_time' | null;
          stripe_product_id: string | null;
          config: Json;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          domain?: string | null;
          status?: 'draft' | 'cooking' | 'live' | 'paused' | 'archived';
          platforms?: 'web' | 'mobile' | 'full';
          icon_url?: string | null;
          cover_url?: string | null;
          vibe?: 'minimal' | 'playful' | 'corporate' | 'premium' | 'bold';
          revenue_model?: string | null;
          stripe_product_id?: string | null;
          config?: Json;
          created_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['apps']['Insert']>;
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          role: 'admin' | 'creator' | 'viewer';
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          role?: 'admin' | 'creator' | 'viewer';
          metadata?: Json;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      app_orders: {
        Row: {
          id: string;
          app_id: string | null;
          creator_id: string | null;
          one_sentence: string;
          target_user: string | null;
          problem_solved: string | null;
          platforms: string;
          desired_domain: string | null;
          revenue_model: string | null;
          vibe: string;
          reference_urls: string[] | null;
          additional_notes: string | null;
          clarifications: Json;
          understanding_complete: boolean;
          status: 'pending' | 'clarifying' | 'approved' | 'building' | 'complete';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          app_id?: string | null;
          creator_id?: string | null;
          one_sentence: string;
          target_user?: string | null;
          problem_solved?: string | null;
          platforms?: string;
          desired_domain?: string | null;
          revenue_model?: string | null;
          vibe?: string;
          reference_urls?: string[] | null;
          additional_notes?: string | null;
          clarifications?: Json;
          understanding_complete?: boolean;
          status?: string;
        };
        Update: Partial<Database['public']['Tables']['app_orders']['Insert']>;
      };
      pipeline_runs: {
        Row: {
          id: string;
          app_id: string;
          order_id: string | null;
          status: 'queued' | 'running' | 'paused' | 'complete' | 'failed';
          current_agent: string | null;
          progress: number;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          app_id: string;
          order_id?: string | null;
          status?: string;
          current_agent?: string | null;
          progress?: number;
        };
        Update: Partial<Database['public']['Tables']['pipeline_runs']['Insert']>;
      };
      agent_tasks: {
        Row: {
          id: string;
          pipeline_id: string;
          agent: 'ux' | 'wireframes' | 'ui' | 'dev' | 'data' | 'ai' | 'sales' | 'cfo' | 'pm';
          status: 'pending' | 'understanding' | 'working' | 'review' | 'complete' | 'blocked';
          input: Json;
          output: Json;
          understanding_score: number;
          questions: Json;
          error_log: string | null;
          sort_order: number;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          pipeline_id: string;
          agent: string;
          status?: string;
          input?: Json;
          output?: Json;
          understanding_score?: number;
          questions?: Json;
          error_log?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database['public']['Tables']['agent_tasks']['Insert']>;
      };
      edit_sessions: {
        Row: {
          id: string;
          app_id: string;
          user_id: string | null;
          voice_transcript: string | null;
          navigation_log: Json;
          change_requests: Json;
          status: 'active' | 'processing' | 'applied' | 'discarded';
          created_at: string;
        };
        Insert: {
          id?: string;
          app_id: string;
          user_id?: string | null;
          voice_transcript?: string | null;
          navigation_log?: Json;
          change_requests?: Json;
          status?: string;
        };
        Update: Partial<Database['public']['Tables']['edit_sessions']['Insert']>;
      };
      publish_requests: {
        Row: {
          id: string;
          app_id: string;
          platform: 'ios' | 'android' | 'web';
          status: 'pending' | 'building' | 'submitted' | 'review' | 'live' | 'rejected';
          store_url: string | null;
          build_id: string | null;
          version: string | null;
          metadata: Json;
          submitted_at: string | null;
          live_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          app_id: string;
          platform: string;
          status?: string;
          store_url?: string | null;
          build_id?: string | null;
          version?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database['public']['Tables']['publish_requests']['Insert']>;
      };
      analytics_events: {
        Row: {
          id: string;
          app_id: string;
          anonymous_id: string | null;
          event_type: string;
          event_data: Json;
          session_id: string | null;
          page_url: string | null;
          device_type: string | null;
          os: string | null;
          browser: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          app_id: string;
          anonymous_id?: string | null;
          event_type: string;
          event_data?: Json;
          session_id?: string | null;
          page_url?: string | null;
          device_type?: string | null;
          os?: string | null;
          browser?: string | null;
        };
        Update: Partial<Database['public']['Tables']['analytics_events']['Insert']>;
      };
      financials: {
        Row: {
          id: string;
          app_id: string;
          period: string;
          revenue: number;
          costs: number;
          profit: number;
          active_users: number;
          new_users: number;
          api_calls: number;
          storage_mb: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          app_id: string;
          period: string;
          revenue?: number;
          costs?: number;
          profit?: number;
          active_users?: number;
          new_users?: number;
          api_calls?: number;
          storage_mb?: number;
          metadata?: Json;
        };
        Update: Partial<Database['public']['Tables']['financials']['Insert']>;
      };
      feedback: {
        Row: {
          id: string;
          user_id: string | null;
          app_id: string | null;
          message: string;
          type: 'feedback' | 'bug' | 'feature' | 'question';
          status: 'new' | 'read' | 'replied' | 'resolved';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          app_id?: string | null;
          message: string;
          type?: string;
          status?: string;
        };
        Update: Partial<Database['public']['Tables']['feedback']['Insert']>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
