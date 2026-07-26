import { getServerSupabaseClient } from './supabase';
import { getAllMeetingsList } from './meetings';

export interface MeetingRequest {
  id: string;
  name: string;
  email: string;
  company?: string;
  phone: string;
  message?: string;
  selectedTimeSlots: string[]; // ISO datetime strings
  confirmedTimeSlot?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface BlockedTimeSlot {
  id: string;
  startTime: string; // ISO datetime string
  endTime: string; // ISO datetime string
  reason?: string;
  createdBy?: string;
  createdAt: string;
}

// Database row types (snake_case)
type MeetingRequestRow = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string;
  message: string | null;
  selected_time_slots: string[];
  confirmed_time_slot: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
};

type BlockedTimeSlotRow = {
  id: string;
  start_time: string;
  end_time: string;
  reason: string | null;
  created_by: string | null;
  created_at: string;
};

/**
 * Convert database row to MeetingRequest object
 */
function rowToMeetingRequest(row: MeetingRequestRow): MeetingRequest {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    company: row.company || undefined,
    phone: row.phone,
    message: row.message || undefined,
    selectedTimeSlots: Array.isArray(row.selected_time_slots) ? row.selected_time_slots : [],
    confirmedTimeSlot: row.confirmed_time_slot || undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert MeetingRequest object to database row
 */
function meetingRequestToRow(request: Partial<MeetingRequest>): Partial<MeetingRequestRow> {
  const row: Partial<MeetingRequestRow> = {};
  if (request.id !== undefined) row.id = request.id;
  if (request.name !== undefined) row.name = request.name;
  if (request.email !== undefined) row.email = request.email;
  if (request.company !== undefined) row.company = request.company || null;
  if (request.phone !== undefined) row.phone = request.phone;
  if (request.message !== undefined) row.message = request.message || null;
  if (request.selectedTimeSlots !== undefined) row.selected_time_slots = request.selectedTimeSlots;
  if (request.confirmedTimeSlot !== undefined) row.confirmed_time_slot = request.confirmedTimeSlot || null;
  if (request.status !== undefined) row.status = request.status;
  if (request.createdAt !== undefined) row.created_at = request.createdAt;
  if (request.updatedAt !== undefined) row.updated_at = request.updatedAt;
  return row;
}

/**
 * Convert database row to BlockedTimeSlot object
 */
function rowToBlockedTimeSlot(row: BlockedTimeSlotRow): BlockedTimeSlot {
  return {
    id: row.id,
    startTime: row.start_time,
    endTime: row.end_time,
    reason: row.reason || undefined,
    createdBy: row.created_by || undefined,
    createdAt: row.created_at,
  };
}

/**
 * Availability rules
 */
export const AVAILABILITY_RULES = {
  sunday: { start: 8, end: 21 }, // 8am - 9pm
  monday: { start: 8, end: 21 },
  tuesday: { start: 8, end: 21 },
  wednesday: { start: 8, end: 21 },
  thursday: { start: 8, end: 21 },
  friday: { start: 8, end: 13 }, // 8am - 1pm
  saturday: null, // Closed
};

/**
 * Helper function to create a Date object that represents a specific time in America/New_York timezone
 * Returns an ISO string (UTC) that when displayed in America/New_York shows the correct time
 * 
 * This uses an iterative approach to find the correct UTC time that displays as the desired time in the target timezone
 */
function createDateInTimezone(year: number, month: number, day: number, hour: number, minute: number, timezone: string = 'America/New_York'): string {
  // Create initial date (this will be interpreted as local server time, but we'll adjust)
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  let testDate = new Date(dateStr);
  
  // Use Intl.DateTimeFormat to get the time in the target timezone more reliably
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  // Check what this time represents in the target timezone
  const parts = formatter.formatToParts(testDate);
  let tzHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  let tzMinute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
  
  // Calculate the difference in minutes
  let diffMinutes = (hour - tzHour) * 60 + (minute - tzMinute);
  
  // Adjust the date
  testDate = new Date(testDate.getTime() - diffMinutes * 60 * 1000);
  
  // Verify the result
  const parts2 = formatter.formatToParts(testDate);
  tzHour = parseInt(parts2.find(p => p.type === 'hour')?.value || '0');
  tzMinute = parseInt(parts2.find(p => p.type === 'minute')?.value || '0');
  
  // Fine-tune if needed (should rarely be needed, but handles edge cases)
  if (tzHour !== hour || tzMinute !== minute) {
    diffMinutes = (hour - tzHour) * 60 + (minute - tzMinute);
    testDate = new Date(testDate.getTime() - diffMinutes * 60 * 1000);
  }
  
  return testDate.toISOString();
}

/**
 * Generate available 30-minute time slots for a date range
 * All times are generated in America/New_York timezone to ensure consistency
 */
export function generateTimeSlots(
  startDate: Date,
  endDate: Date,
  availabilityRules: typeof AVAILABILITY_RULES = AVAILABILITY_RULES
): string[] {
  const slots: string[] = [];
  const TIMEZONE = 'America/New_York';
  
  // Get start and end dates in the target timezone
  const startYear = parseInt(startDate.toLocaleString('en-US', { timeZone: TIMEZONE, year: 'numeric' }));
  const startMonth = parseInt(startDate.toLocaleString('en-US', { timeZone: TIMEZONE, month: 'numeric' })) - 1;
  const startDay = parseInt(startDate.toLocaleString('en-US', { timeZone: TIMEZONE, day: 'numeric' }));
  
  const endYear = parseInt(endDate.toLocaleString('en-US', { timeZone: TIMEZONE, year: 'numeric' }));
  const endMonth = parseInt(endDate.toLocaleString('en-US', { timeZone: TIMEZONE, month: 'numeric' })) - 1;
  const endDay = parseInt(endDate.toLocaleString('en-US', { timeZone: TIMEZONE, day: 'numeric' }));
  
  const current = new Date(startYear, startMonth, startDay);
  const endDateTz = new Date(endYear, endMonth, endDay);
  
  while (current <= endDateTz) {
    const dayOfWeek = current.getDay(); // 0 = Sunday, 6 = Saturday
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
    const rule = availabilityRules[dayName as keyof typeof availabilityRules];
    
    if (rule) {
      const { start, end } = rule;
      const year = current.getFullYear();
      const month = current.getMonth();
      const day = current.getDate();
      
      // Generate 30-minute slots from start to end hour
      for (let hour = start; hour < end; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const slotISO = createDateInTimezone(year, month, day, hour, minute, TIMEZONE);
          slots.push(slotISO);
        }
      }
    }
    
    // Move to next day
    current.setDate(current.getDate() + 1);
  }
  
  return slots;
}

/**
 * Get blocked time slots from database
 */
export async function getBlockedTimeSlots(startDate: Date, endDate: Date): Promise<BlockedTimeSlot[]> {
  const supabase = getServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('blocked_time_slots')
    .select('*')
    .gte('start_time', startDate.toISOString())
    .lte('end_time', endDate.toISOString());
  
  if (error) {
    console.error('Error getting blocked time slots:', error);
    return [];
  }
  
  return (data || []).map(rowToBlockedTimeSlot);
}

/**
 * Check if a time slot overlaps with blocked slots or existing meetings
 */
function isSlotBlocked(
  slotStart: string,
  slotEnd: string,
  blockedSlots: BlockedTimeSlot[],
  existingMeetings: Array<{ scheduledAt: string; duration: number }>
): boolean {
  const slotStartTime = new Date(slotStart).getTime();
  const slotEndTime = new Date(slotEnd).getTime();
  
  // Check against blocked slots
  for (const blocked of blockedSlots) {
    const blockedStart = new Date(blocked.startTime).getTime();
    const blockedEnd = new Date(blocked.endTime).getTime();
    
    // Check for overlap
    if (slotStartTime < blockedEnd && slotEndTime > blockedStart) {
      return true;
    }
  }
  
  // Check against existing meetings (30-minute blocks)
  for (const meeting of existingMeetings) {
    const meetingStart = new Date(meeting.scheduledAt).getTime();
    const meetingEnd = meetingStart + meeting.duration * 60 * 1000;
    
    // Check for overlap
    if (slotStartTime < meetingEnd && slotEndTime > meetingStart) {
      return true;
    }
  }
  
  return false;
}

/**
 * Filter available slots by removing blocked slots and existing meetings
 */
export async function filterAvailableSlots(
  slots: string[],
  startDate: Date,
  endDate: Date
): Promise<string[]> {
  try {
    const blockedSlots = await getBlockedTimeSlots(startDate, endDate);
    let existingMeetings: Array<{ scheduledAt: string; duration: number }> = [];
    
    try {
      const meetings = await getAllMeetingsList();
      // Filter meetings to only those in the date range
      const relevantMeetings = meetings.filter((meeting) => {
        const meetingDate = new Date(meeting.scheduledAt);
        return meetingDate >= startDate && meetingDate <= endDate;
      });
      
      existingMeetings = relevantMeetings.map((m) => ({ scheduledAt: m.scheduledAt, duration: m.duration }));
    } catch (error) {
      console.error('Error fetching meetings for slot filtering:', error);
      // Continue without filtering by meetings if there's an error
    }
    
    return slots.filter((slot) => {
      const slotStart = new Date(slot);
      const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000); // 30 minutes
      
      return !isSlotBlocked(
        slotStart.toISOString(),
        slotEnd.toISOString(),
        blockedSlots,
        existingMeetings
      );
    });
  } catch (error) {
    console.error('Error filtering available slots:', error);
    // Return all slots if filtering fails (graceful degradation)
    return slots;
  }
}

/**
 * Create a meeting request
 */
export async function createMeetingRequest(
  data: Omit<MeetingRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>
): Promise<MeetingRequest> {
  const supabase = getServerSupabaseClient();
  
  const row: Partial<MeetingRequestRow> = {
    name: data.name,
    email: data.email,
    company: data.company || null,
    phone: data.phone,
    message: data.message || null,
    selected_time_slots: data.selectedTimeSlots,
    status: 'pending',
  };
  
  const { data: inserted, error } = await supabase
    .from('meeting_requests')
    .insert(row)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating meeting request:', error);
    throw new Error(`Failed to create meeting request: ${error.message}`);
  }
  
  return rowToMeetingRequest(inserted as MeetingRequestRow);
}

/**
 * Get meeting requests (admin only)
 */
export async function getMeetingRequests(status?: 'pending' | 'confirmed' | 'cancelled'): Promise<MeetingRequest[]> {
  const supabase = getServerSupabaseClient();
  
  let query = supabase.from('meeting_requests').select('*').order('created_at', { ascending: false });
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error getting meeting requests:', error);
    return [];
  }
  
  return (data || []).map(rowToMeetingRequest);
}

/**
 * Get a meeting request by ID
 */
export async function getMeetingRequest(id: string): Promise<MeetingRequest | null> {
  const supabase = getServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('meeting_requests')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error getting meeting request:', error);
    return null;
  }
  
  return data ? rowToMeetingRequest(data as MeetingRequestRow) : null;
}

/**
 * Confirm a meeting request (admin only)
 * This will block 30 minutes, create a meeting, and update the request status
 */
export async function confirmMeetingRequest(
  requestId: string,
  selectedSlot: string,
  hostUserId: string // Clerk user ID of the admin
): Promise<{ meetingRequest: MeetingRequest; meetingId?: string }> {
  const supabase = getServerSupabaseClient();
  
  // Get the meeting request
  const request = await getMeetingRequest(requestId);
  if (!request) {
    throw new Error('Meeting request not found');
  }
  
  // Allow re-confirming if already confirmed (to change time slot)
  // But don't allow if cancelled
  if (request.status === 'cancelled') {
    throw new Error(`Cannot confirm a cancelled meeting request. Current status: ${request.status}`);
  }
  
  // If already confirmed, we need to handle the existing meeting
  const isReconfirming = request.status === 'confirmed';
  
  if (isReconfirming) {
    // Check if there's an existing meeting linked to this request
    const { data: existingMeetings } = await supabase
      .from('meetings')
      .select('id, scheduled_at')
      .eq('meeting_request_id', requestId)
      .limit(1);
    
    if (existingMeetings && existingMeetings.length > 0) {
      // Delete the existing meeting
      // Note: We don't need to delete blocked_time_slots because meetings no longer create them.
      // This cleanup is only for backwards compatibility with old meetings that might have had blocked slots.
      const existingMeeting = existingMeetings[0];
      
      // Delete the old meeting
      const { error: deleteError } = await supabase
        .from('meetings')
        .delete()
        .eq('id', existingMeeting.id);
      
      if (deleteError) {
        console.error('Error deleting old meeting:', deleteError);
        // Continue anyway - we'll create a new meeting
      }
    }
  } else if (request.status !== 'pending') {
    throw new Error(`Meeting request is not in a confirmable state. Current status: ${request.status}`);
  }
  
  // Verify the selected slot is in the user's selected slots
  if (!request.selectedTimeSlots.includes(selectedSlot)) {
    throw new Error('Selected slot is not in the user\'s requested slots');
  }
  
  // Update the meeting request
  // Note: We don't create a blocked_time_slot here because the meeting itself will block the time.
  // Blocked time slots are only for manual admin blocks, not scheduled meetings.
  const { data: updatedRequest, error: updateError } = await supabase
    .from('meeting_requests')
    .update({
      confirmed_time_slot: selectedSlot,
      status: 'confirmed',
    })
    .eq('id', requestId)
    .select()
    .single();
  
  if (updateError) {
    console.error('Error updating meeting request:', updateError);
    throw new Error(`Failed to update meeting request: ${updateError.message}`);
  }
  
  // Create a meeting entry
  // hostUserId is a Clerk user ID, but the database stores database UUIDs
  // We need to get the host user's database UUID
  const { getUserByClerkId } = await import('./users');
  const hostDbUser = await getUserByClerkId(hostUserId);
  
  if (!hostDbUser) {
    throw new Error('Host user not found in database');
  }
  
  const { createMeeting, generateJitsiRoomName } = await import('./meetings');
  const tempJitsiRoomName = `vercatryx-temp-${Date.now()}`;
  
  // Create meeting with database UUID for host_user_id
  // Note: We pass the database UUID directly since createMeeting stores it as-is
  const meetingTitle = request.company 
    ? `${request.company} Consultation`
    : `${request.name} Consultation`;
  
  const meeting = await createMeeting({
    // id is omitted - will be generated by database
    title: meetingTitle,
    description: request.message || `Scheduled consultation with ${request.name}${request.company ? ` from ${request.company}` : ''}`,
    hostUserId: hostDbUser.id, // Database UUID - stored directly in host_user_id column
    participantUserIds: [],
    participantCompanyIds: [],
    accessType: 'public',
    scheduledAt: selectedSlot,
    duration: 30,
    jitsiRoomName: tempJitsiRoomName,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    meetingRequestId: requestId,
  });
  
  // Update meeting with proper Jitsi room name
  const { updateMeeting } = await import('./meetings');
  const finalMeeting = await updateMeeting(meeting.id, {
    jitsiRoomName: generateJitsiRoomName(meeting.id),
  });
  
  return {
    meetingRequest: rowToMeetingRequest(updatedRequest as MeetingRequestRow),
    meetingId: finalMeeting?.id || meeting.id,
  };
}

/**
 * Block a time slot (admin only)
 */
export async function blockTimeSlot(
  startTime: string,
  endTime: string,
  reason: string | undefined,
  userId: string // Database UUID
): Promise<BlockedTimeSlot> {
  const supabase = getServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('blocked_time_slots')
    .insert({
      start_time: startTime,
      end_time: endTime,
      reason: reason || null,
      created_by: userId,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error blocking time slot:', error);
    throw new Error(`Failed to block time slot: ${error.message}`);
  }
  
  return rowToBlockedTimeSlot(data as BlockedTimeSlotRow);
}

/**
 * Unblock a time slot (admin only)
 */
export async function unblockTimeSlot(blockId: string): Promise<boolean> {
  const supabase = getServerSupabaseClient();
  
  const { error } = await supabase
    .from('blocked_time_slots')
    .delete()
    .eq('id', blockId);
  
  if (error) {
    console.error('Error unblocking time slot:', error);
    return false;
  }
  
  return true;
}

/**
 * Get all blocked time slots
 */
export async function getAllBlockedTimeSlots(startDate?: Date, endDate?: Date): Promise<BlockedTimeSlot[]> {
  const supabase = getServerSupabaseClient();
  
  let query = supabase.from('blocked_time_slots').select('*').order('start_time', { ascending: true });
  
  if (startDate) {
    query = query.gte('start_time', startDate.toISOString());
  }
  
  if (endDate) {
    query = query.lte('end_time', endDate.toISOString());
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error getting blocked time slots:', error);
    return [];
  }
  
  return (data || []).map(rowToBlockedTimeSlot);
}

