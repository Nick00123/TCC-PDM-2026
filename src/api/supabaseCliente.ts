import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://wmttnkyaiupvxcnlpgvf.supabase.co';
const supabaseKey = 'sb_publishable_53ypUqA7FTrSFcaSsmYeXQ_JSK_J9uv';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
