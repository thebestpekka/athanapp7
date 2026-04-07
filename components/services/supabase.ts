
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://pdqzfpdwlvwdpxkxikkm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkcXpmcGR3bHZ3ZHB4a3hpa2ttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMjMzMDcsImV4cCI6MjA2NDY5OTMwN30.dJ6VxEdpv2JdN_NahWrm6qhhv_Y_OUXciddovSBNfYw';
const supabase = createClient(supabaseUrl, supabaseKey);






// Fetch all mosques for the list
export const fetchMosques = async () => {
  const { data, error } = await supabase
    .from('mosques')
    .select('*')
    .order('mosque', { ascending: true });

  if (error) throw error;
  return data;
};


export const fetchPrayerTimes = async (mosque: string, limit:number) => {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from('new prayers')
    .select('*')
    .eq('mosque', mosque)
    .gte('date', today) // Get times from today onwards
    .order('date', { ascending: true })
    .limit(limit); // Example: Get next 7 days

  if (error) throw error;
  return data;
};



export const update = async ()=>{
  
  const { data, error } = await supabase
          .from('info')
          .select('version, link')
          .single();
          if (error) throw error;
           return data;

}

export const sendlogs = async (link: string, logContent: string) => {
  const { data, error } = await supabase.storage
    .from('app-logs')
    .upload(link, logContent, {
      contentType: 'text/plain', // Tells Supabase to save it as a text file
      cacheControl: '3600',
      upsert: true, // Overwrites the file if it already exists
    });

  if (error) {
    console.log("supabase:  Supabase Upload Error:", error);
  } else {
    console.log(`supabase:  ✅ Logs successfully synced to bucket: ${link}`);
  }
};