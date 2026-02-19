'use client';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser-side Supabase client using the anon key.
 * Only for reading public data; sensitive ops must go through API routes.
 */
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
