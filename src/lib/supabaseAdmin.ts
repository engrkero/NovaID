import { createClient } from '@supabase/supabase-js';

// Backend-only supabase client (admin role)
// IMPORTANT: Never import this file in the frontend code

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_service_key';

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
