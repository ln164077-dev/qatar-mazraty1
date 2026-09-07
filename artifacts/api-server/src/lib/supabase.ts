import { createClient } from '@supabase/supabase-js';

const supabaseEnabled = process.env.ENABLE_SUPABASE === 'true';
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = supabaseEnabled && supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export function getPublicImageUrl(filename: string): string {
  return `${supabaseUrl}/storage/v1/object/public/product-images/${filename}`;
}
