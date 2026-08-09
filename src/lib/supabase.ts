import { createClient } from '@supabase/supabase-js';

// Initialize database client
const supabaseUrl = 'https://lifvlbtwqsgtpamfaela.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImQwMzJhZTc3LTRmOTItNDhlNC1hYjhhLWQwNzQ4MWVjMjcwOCJ9.eyJwcm9qZWN0SWQiOiJsaWZ2bGJ0d3FzZ3RwYW1mYWVsYSIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzY3MzY1NTAxLCJleHAiOjIwODI3MjU1MDEsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.YgIylR6ZUndpOP2y9uGxM4qheNy6Uy13sf5AWRiH4gc';

// Create client with additional properties for edge function invocation
const supabase = createClient(supabaseUrl, supabaseKey);

// Export URL and key for direct API calls
export { supabase };
export const supabaseConfig = {
  url: supabaseUrl,
  key: supabaseKey,
};
