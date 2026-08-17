// lib/leaves.js
import { supabase } from './supabaseClient';

// Apply for leave
export async function applyLeave(Id, startDate, endDate, reason) {
  return await supabase
    .from('leaves')
    .insert([{ id: Id, start_date: startDate, end_date: endDate, reason }]);
}

// Fetch leaves for employee
export async function getLeaves(Id) {
  return await supabase
    .from('leaves')
    .select('*')
    .eq('id', Id)
    .order('created_at', { ascending: false });
}

// Approve/Reject leave (admin only)
export async function updateLeaveStatus(leaveId, status) {
  return await supabase
    .from('leaves')
    .update({ status })
    .eq('id', leaveId);
}
