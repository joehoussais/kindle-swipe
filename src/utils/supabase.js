import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lridsguhborxvlcalana.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyaWRzZ3VoYm9yeHZsY2FsYW5hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMjYyNjcsImV4cCI6MjA4MzYwMjI2N30.S9L4hgldnivS_TEFLLsAyTYN82kh9X5riP1i_TnOhcA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Highlights database functions
export async function saveHighlightsToDb(userId, highlights) {
  // Safety check: don't wipe DB if highlights array is empty
  // This prevents accidental data loss from race conditions
  if (highlights.length === 0) {
    console.warn('saveHighlightsToDb called with empty highlights, skipping to prevent data loss');
    return { data: [], skipped: true };
  }

  // Delete existing highlights for user and insert new ones
  const { error: deleteError } = await supabase
    .from('highlights')
    .delete()
    .eq('user_id', userId);

  if (deleteError) {
    console.error('Error deleting old highlights:', deleteError);
    return { error: deleteError };
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
    source: h.source || 'kindle',
    captured_at: h.capturedAt || null,
    comment: h.comment || null,
    created_at: new Date().toISOString(),
    // Recall system fields
    integration_score: h.integrationScore || 0,
    view_count: h.viewCount || 0,
    recall_attempts: h.recallAttempts || 0,
    recall_successes: h.recallSuccesses || 0,
    last_viewed_at: h.lastViewedAt || null,
    tags: h.tags || []
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
    dateHighlighted: row.date_highlighted,
    source: row.source || 'kindle',
    capturedAt: row.captured_at,
    comment: row.comment,
    // Recall system fields
    integrationScore: row.integration_score || 0,
    viewCount: row.view_count || 0,
    recallAttempts: row.recall_attempts || 0,
    recallSuccesses: row.recall_successes || 0,
    lastViewedAt: row.last_viewed_at || null,
    tags: row.tags || []
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

// Explicitly clear all highlights for a user (only called from clearAll)
export async function clearAllHighlightsFromDb(userId) {
  const { error } = await supabase
    .from('highlights')
    .delete()
    .eq('user_id', userId);

  if (error) {
    console.error('Error clearing highlights:', error);
    return { error };
  }

  return { success: true };
}

export async function updateHighlightInDb(userId, highlightId, updates) {
  // Convert camelCase to snake_case for DB
  const dbUpdates = {};
  if (updates.integrationScore !== undefined) dbUpdates.integration_score = updates.integrationScore;
  if (updates.viewCount !== undefined) dbUpdates.view_count = updates.viewCount;
  if (updates.recallAttempts !== undefined) dbUpdates.recall_attempts = updates.recallAttempts;
  if (updates.recallSuccesses !== undefined) dbUpdates.recall_successes = updates.recallSuccesses;
  if (updates.lastViewedAt !== undefined) dbUpdates.last_viewed_at = updates.lastViewedAt;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
  if (updates.comment !== undefined) dbUpdates.comment = updates.comment;

  const { error } = await supabase
    .from('highlights')
    .update(dbUpdates)
    .eq('user_id', userId)
    .eq('highlight_id', highlightId);

  if (error) {
    console.error('Error updating highlight:', error);
    return { error };
  }

  return { success: true };
}
