import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Folder {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  user_id: string;
  color: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  deck_count?: number;
  subfolder_count?: number;
}

export interface Deck {
  id: string;
  name: string;
  description?: string;
  folder_id: string;
  user_id: string;
  color: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  // Computed fields from database function
  total_cards?: number;
  cards_due?: number;
  accuracy_percentage?: number;
  last_studied?: string;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  user_id: string;
  front_content: string;
  back_content: string;
  front_content_html?: string;
  back_content_html?: string;
  front_image_url?: string;
  back_image_url?: string;
  difficulty: number;
  next_review_date: string;
  review_count: number;
  correct_count: number;
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  user_id: string;
  deck_id: string;
  flashcard_id: string;
  was_correct: boolean;
  response_time_ms?: number;
  difficulty_before?: number;
  difficulty_after?: number;
  created_at: string;
}
