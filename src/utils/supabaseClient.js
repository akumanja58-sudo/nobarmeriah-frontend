import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://efmbcbeviwihpwsqzczl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmbWJjYmV2aXdpaHB3c3F6Y3psIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzODgyOTMsImV4cCI6MjA4MTk2NDI5M30.FpPzl-WOWhtvJW5Od5HXsqFjoGKuaWVgBGMBvxxST28';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

if (typeof window !== 'undefined') {
    window.supabase = supabase;
}