// src/lib/types.ts

export interface User {
  id: string;
  email: string;
  credits: number;
}

export interface Lead {
  id: string; // UUID
  place_id: string; // The Google ID
  business_name: string | null;
  rating: number | null;
  review_count: number | null;

  // Geographical (Updated for V2 Architecture)
  city?: string | null;
  zip_code?: string | null;

  // Contact & Enrichment
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  full_name?: string | null;
  linkedin?: string | null;
  email_status?: string | null;

  // Analysis
  reviews_per_score_1?: number | null;
  reviews_per_score_5?: number | null;
  website_generator?: string | null;
  website_has_fb_pixel?: boolean | null;
  is_verified?: boolean | null;
  photos_count?: number | null;

  // Categorization
  bucket_category?: string | null; 
  bucket_details?: string | null;
  business_status?: string | null;

  // Caching System
  keyword?: string | null;
  last_scraped_at?: string | null;

  // Frontend State (Joined from user_leads)
  is_unlocked?: boolean;
}

// Junction Table for User <-> Lead
export interface UserLead {
  user_id: string;
  lead_id: string;
  is_unlocked: boolean;
  notes?: string | null;
}

// Geographical Database (For Area Selection)
export interface PostalCode {
  id: string;
  city: string;
  zip_code: string;
  admin1?: string | null; // State / Province
  admin2?: string | null; // County / Borough
}

// System Monitors
export interface Monitor {
  id: string;
  user_id: string;
  keyword: string;
  location: string;
  status: "active" | "paused" | "completed" | "failed";
  created_at: string;
}
