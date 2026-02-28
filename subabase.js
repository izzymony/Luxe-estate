import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://aqhwfjiphxgiylgjfhuu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxaHdmamlwaHhnaXlsZ2pmaHV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0MTgxNDksImV4cCI6MjA4Njk5NDE0OX0.1WK_Cf2v9Is5dJMby8SKTG0cBiJ3wqv3RABC0QARfPs'

export const supabase = createClient(supabaseUrl, supabaseKey)