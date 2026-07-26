/**
 * User management functions for company-based system
 */

import { parseSuperAdminEmails } from '@/lib/super-admin';
import { normalizeEmailForAuth } from '@/lib/email-normalize';
import { getServerSupabaseClient } from './supabase';
import type {
  User,
  UserWithCompany,
  CreateUserInput,
  UpdateUserInput,
  UserDisplayInfo,
  UserRole,
} from '@/types/company';

/** Hide rows whose email is in SUPER_ADMIN_EMAILS (replaces Clerk metadata superuser filter). */
export function filterOutSuperAdminUsers<T extends { email: string }>(users: T[]): T[] {
  const set = parseSuperAdminEmails();
  if (set.size === 0) return users;
  return users.filter((u) => !set.has(normalizeEmailForAuth(u.email)));
}

/**
 * Get user by Auth.js user id (`next_auth.users.id`, stored as `public.users.auth_user_id`)
 */
export async function getUserByAuthUserId(authUserId: string): Promise<User | null> {
  try {
    const supabase = getServerSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/** @deprecated Use getUserByAuthUserId */
export async function getUserByClerkId(clerkUserId: string): Promise<User | null> {
  return getUserByAuthUserId(clerkUserId);
}

/**
 * Get multiple users by Auth.js user ids
 */
export async function getUsersByAuthUserIds(authUserIds: string[]): Promise<User[]> {
  try {
    if (authUserIds.length === 0) {
      return [];
    }

    const supabase = getServerSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .in('auth_user_id', authUserIds);

    if (error) {
      console.error('Error getting users by auth user IDs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting users by auth user IDs:', error);
    return [];
  }
}

/** @deprecated Use getUsersByAuthUserIds */
export async function getUsersByClerkIds(clerkUserIds: string[]): Promise<User[]> {
  return getUsersByAuthUserIds(clerkUserIds);
}

/**
 * Get user by email address
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const supabase = getServerSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/** Case-insensitive email match (invite / OAuth profiles). */
export async function getUserByEmailNormalized(email: string): Promise<User | null> {
  const normalized = normalizeEmailForAuth(email);
  if (!normalized) return null;
  try {
    const supabase = getServerSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('email', normalized)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

/**
 * Get user by email and company ID
 */
export async function getUserByEmailAndCompany(email: string, companyId: string): Promise<User | null> {
  try {
    const supabase = getServerSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('company_id', companyId)
      .maybeSingle();

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const supabase = getServerSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 or 1 rows without error

    if (error) {
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Get user with company details
 */
export async function getUserWithCompany(userId: string): Promise<UserWithCompany | null> {
  try {
    const supabase = getServerSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        company:companies(*)
      `)
      .eq('id', userId)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 or 1 rows without error

    if (error) {
      return null;
    }

    return data as unknown as UserWithCompany;
  } catch (error) {
    return null;
  }
}

/**
 * Get all users in a company
 */
export async function getUsersByCompany(companyId: string): Promise<User[]> {
  try {
    const supabase = getServerSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      return [];
    }

    const users = data || [];
    return filterOutSuperAdminUsers(users);
  } catch (error) {
    return [];
  }
}

/**
 * Get all users (super admin only)
 */
export async function getAllUsers(): Promise<UserWithCompany[]> {
  try {
    const supabase = getServerSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        company:companies(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error in getAllUsers:', error);
      return [];
    }

    if (!data) {
      console.log('No users data returned');
      return [];
    }

    const filtered = filterOutSuperAdminUsers(data as unknown as UserWithCompany[]);
    console.log(
      `getAllUsers returned ${data.length} users, ${filtered.length} after filtering superusers`
    );
    return filtered;
  } catch (error) {
    console.error('Exception in getAllUsers:', error);
    return [];
  }
}

/**
 * Create a new user
 */
export async function createUser(input: CreateUserInput): Promise<User> {
  try {
    const supabase = getServerSupabaseClient();
    const { data, error } = await supabase
      .from('users')
      .insert(input)
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

/**
 * Update a user
 */
export async function updateUser(userId: string, input: UpdateUserInput): Promise<User | null> {
  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .update(input)
    .eq('id', userId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('Error updating user:', error);
    throw new Error('Failed to update user');
  }

  if (!data) {
    console.error('User not found:', userId);
    return null;
  }

  return data;
}

/**
 * Delete a user (hard delete - permanently removes from database)
 */
export async function deleteUser(userId: string): Promise<void> {
  const supabase = getServerSupabaseClient();
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
}

/**
 * Hard delete a user (permanently remove)
 */
export async function hardDeleteUser(userId: string): Promise<void> {
  const supabase = getServerSupabaseClient();
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) {
    console.error('Error hard deleting user:', error);
    throw new Error('Failed to hard delete user');
  }
}

/**
 * Get user display info (formatted name or email)
 */
export function getUserDisplayInfo(user: {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: UserRole;
}): UserDisplayInfo {
  const name = user.first_name && user.last_name
    ? `${user.first_name} ${user.last_name}`
    : user.first_name || user.last_name || user.email;

  return {
    id: user.id,
    name,
    email: user.email,
    role: user.role,
  };
}

/**
 * Get multiple users' display info
 */
export async function getUsersDisplayInfo(userIds: string[]): Promise<UserDisplayInfo[]> {
  if (userIds.length === 0) return [];

  const supabase = getServerSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, last_name, email, role')
    .in('id', userIds);

  if (error) {
    console.error('Error fetching users display info:', error);
    return [];
  }

  return (data || []).map(getUserDisplayInfo);
}

/**
 * Check if user has admin role in their company
 */
export async function isCompanyAdmin(userId: string): Promise<boolean> {
  const user = await getUserById(userId);
  return user?.role === 'admin';
}

/**
 * Check if user belongs to a specific company
 */
export async function userBelongsToCompany(
  userId: string,
  companyId: string
): Promise<boolean> {
  const user = await getUserById(userId);
  return user?.company_id === companyId;
}
