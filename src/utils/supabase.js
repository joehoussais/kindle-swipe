import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lridsguhborxvlcalana.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyaWRzZ3VoYm9yeHZsY2FsYW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjYyNjcsImV4cCI6MjA4MzYwMjI2N30.S9L4hgldnivS_TEFLLsAyTYN82kh9X5riP1i_TnOhcA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Highlights database functions
export async function saveHighlightsToDb(userId, highlights) {
  // Delete existing highlights for user and insert new ones
  const { error: deleteError } = await supabase
    .from('highlights')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    console.error('Error deleting old highlights:', deleteError);
    return { error: deleteError };
  }

  if (highlights.length === 0) {
    return { data: [] };
  }

  const rows = highlights.map(h => ({
    user_id: userId,
    highlight_id: h.id,
    text: h.text,
    title: h.title,
    author: h.author,
    page: h.page || null,
    location: h.location || null,
    date_highlighted: h.dateHighlighted || null,
    created_at: new Date().toISOString()
  }));

  const { data, error } = await supabase
    .from('highlights')
    .insert(rows);

  if (error) {
    console.error('Error saving highlights:', error);
    return { error };
  }

  return { data };
}

export async function loadHighlightsFromDb(userId) {
  const { data, error } = await supabase
    .from('highlights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading highlights:', error);
    return { error, highlights: [] };
  }

  // Convert back to app format
  const highlights = data.map(row => ({
    id: row.highlight_id,
    text: row.text,
    title: row.title,
    author: row.author,
    page: row.page,
    location: row.location,
    dateHighlighted: row.date_highlighted
  }));

  return { highlights };
}

export async function addHighlightToDb(userId, highlight) {
  const { data, error } = await supabase
    .from('highlights')
    .insert({
      user_id: userId,
      highlight_id: highlight.id,
      text: highlight.text,
      title: highlight.title,
      author: highlight.author,
      page: highlight.page || null,
      location: highlight.location || null,
      date_highlighted: highlight.dateHighlighted || null,
      created_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error adding highlight:', error);
    return { error };
  }

  return { data };
}

export async function deleteHighlightFromDb(userId, highlightId) {
  const { error } = await supabase
    .from('highlights')
    .delete()
    .eq('user_id', userId)
    .eq('highlight_id', highlightId);

  if (error) {
    console.error('Error deleting highlight:', error);
    return { error };
  }

  return { success: true };
}
