import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// مشروع Supabase الخاص بتطبيق حلم — مستقل تمامًا عن مشروع الموقع hilmlearning.com
const SUPABASE_URL = 'https://oqjcjxjnlqzwijnavbzr.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_81UKF04CoKzB5pl4tZ4CxA_dTLoxlmR';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
