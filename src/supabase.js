
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bhjncrkkwfpyfcgqxrmq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoam5jcmtrd2ZweWZjZ3F4cm1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMjgwODcsImV4cCI6MjA4NTkwNDA4N30.dCWQbKBzFuu-Fu24h8zTMdOOOqwJLY1GnXcYX9pdZZM';

export const supabase = createClient(supabaseUrl, supabaseKey);
