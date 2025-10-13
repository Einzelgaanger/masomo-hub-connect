/**
 * Advanced search utilities with debouncing and filtering
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Debounce function to limit API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Search users by name, email, or admission number
 */
export async function searchUsers(
  query: string,
  universityId?: string,
  limit: number = 20
) {
  try {
    let searchQuery = supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,admission_number.ilike.%${query}%`)
      .limit(limit);

    if (universityId) {
      searchQuery = searchQuery.eq('university_id', universityId);
    }

    const { data, error } = await searchQuery;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('User search error:', error);
    return [];
  }
}

/**
 * Search classes by course name or code
 */
export async function searchClasses(
  query: string,
  universityId?: string,
  limit: number = 20
) {
  try {
    let searchQuery = supabase
      .from('classes')
      .select('*')
      .or(`course_name.ilike.%${query}%,course_code.ilike.%${query}%`)
      .limit(limit);

    if (universityId) {
      searchQuery = searchQuery.eq('university_id', universityId);
    }

    const { data, error } = await searchQuery;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Class search error:', error);
    return [];
  }
}

/**
 * Search uploads (notes, past papers, etc.)
 */
export async function searchUploads(
  query: string,
  type?: 'notes' | 'past_papers' | 'assignments',
  classId?: string,
  limit: number = 50
) {
  try {
    let searchQuery = supabase
      .from('uploads')
      .select('*, profiles(full_name, avatar_url)')
      .ilike('title', `%${query}%`)
      .limit(limit)
      .order('created_at', { ascending: false });

    if (type) {
      searchQuery = searchQuery.eq('type', type);
    }

    if (classId) {
      searchQuery = searchQuery.eq('class_id', classId);
    }

    const { data, error } = await searchQuery;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Upload search error:', error);
    return [];
  }
}

/**
 * Search job postings
 */
export async function searchJobs(
  query: string,
  location?: string,
  limit: number = 20
) {
  try {
    let searchQuery = supabase
      .from('job_postings')
      .select('*')
      .or(`title.ilike.%${query}%,company.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit)
      .order('created_at', { ascending: false });

    if (location) {
      searchQuery = searchQuery.ilike('location', `%${location}%`);
    }

    const { data, error } = await searchQuery;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Job search error:', error);
    return [];
  }
}

/**
 * Search events
 */
export async function searchEvents(
  query: string,
  universityId?: string,
  limit: number = 20
) {
  try {
    let searchQuery = supabase
      .from('events')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,venue.ilike.%${query}%`)
      .limit(limit)
      .order('date', { ascending: true });

    if (universityId) {
      searchQuery = searchQuery.eq('university_id', universityId);
    }

    const { data, error } = await searchQuery;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Event search error:', error);
    return [];
  }
}

/**
 * Global search across multiple tables
 */
export async function globalSearch(query: string, universityId?: string) {
  const [users, classes, uploads, jobs, events] = await Promise.all([
    searchUsers(query, universityId, 5),
    searchClasses(query, universityId, 5),
    searchUploads(query, undefined, undefined, 10),
    searchJobs(query, undefined, 5),
    searchEvents(query, universityId, 5),
  ]);

  return {
    users,
    classes,
    uploads,
    jobs,
    events,
  };
}

/**
 * Highlight search terms in text
 */
export function highlightSearchTerm(text: string, searchTerm: string): string {
  if (!searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Create debounced search function
 */
export function createDebouncedSearch<T>(
  searchFunction: (query: string, ...args: any[]) => Promise<T>,
  delay: number = 300
) {
  return debounce(searchFunction, delay);
}
