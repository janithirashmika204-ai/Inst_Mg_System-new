import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export type CollectionName = 'students' | 'teachers' | 'classes' | 'attendance' | 'fees' | 'exams';
export type EduPeakRecord = Record<string, any> & { id: string | number };

type CollectionConfig = {
  table: string;
  toRow: (record: EduPeakRecord, instituteId: string) => Record<string, unknown>;
  fromRow: (row: Record<string, any>) => EduPeakRecord;
};

const cleanDate = (value: unknown): string | null => {
  const candidate = String(value ?? '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(candidate) ? candidate : null;
};

const cleanNumber = (value: unknown, fallback = 0): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const cleanText = (value: unknown): string | null => {
  const candidate = String(value ?? '').trim();
  return candidate ? candidate : null;
};

const raw = (row: Record<string, any>) =>
  row.raw_data && typeof row.raw_data === 'object' && !Array.isArray(row.raw_data)
    ? row.raw_data
    : {};

const configs: Record<CollectionName, CollectionConfig> = {
  students: {
    table: 'students',
    toRow: (r, institute_id) => ({
      institute_id, id: String(r.id), student_code: String(r.id),
      full_name: String(r.name || 'Unnamed student'), nic: cleanText(r.nic),
      date_of_birth: cleanDate(r.dob || r.dateOfBirth), gender: cleanText(r.gender),
      email: cleanText(r.email), phone: cleanText(r.phone), address: cleanText(r.address),
      city: cleanText(r.city), school: cleanText(r.school), current_grade: cleanText(r.grade),
      first_enrolled_grade: cleanText(r.firstEnrolledGrade || r.grade),
      enrollment_date: cleanDate(r.regDate || r.enrollmentDate),
      parent_name: cleanText(r.parent || r.parentName), parent_phone: cleanText(r.parentPhone),
      branch: cleanText(r.branch), monthly_fee: Math.max(0, cleanNumber(r.fee ?? r.monthlyFee)),
      concession: String(r.concession || 'None'), status: String(r.status || 'Active'),
      avatar: cleanText(r.avatar), raw_data: r,
    }),
    fromRow: (row) => ({
      ...raw(row), id: row.id, name: row.full_name, nic: row.nic || '',
      dob: row.date_of_birth || '', gender: row.gender || '', email: row.email || '',
      phone: row.phone || '', address: row.address || '', city: row.city || '',
      school: row.school || '', grade: row.current_grade || '',
      firstEnrolledGrade: row.first_enrolled_grade || row.current_grade || '',
      regDate: row.enrollment_date || '', parent: row.parent_name || '',
      parentPhone: row.parent_phone || '', branch: row.branch || '',
      fee: cleanNumber(row.monthly_fee), concession: row.concession || 'None',
      status: row.status || 'Active', avatar: row.avatar || raw(row).avatar || '',
    }),
  },
  teachers: {
    table: 'teachers',
    toRow: (r, institute_id) => ({
      institute_id, id: String(r.id), full_name: String(r.name || 'Unnamed teacher'),
      nic: cleanText(r.nic), primary_subject: cleanText(r.subject), phone: cleanText(r.phone),
      email: cleanText(r.email), branch: cleanText(r.branch), joined_date: cleanDate(r.joined),
      avatar: cleanText(r.avatar), status: String(r.status || 'Active'), raw_data: r,
    }),
    fromRow: (row) => ({
      ...raw(row), id: row.id, name: row.full_name, nic: row.nic || '',
      subject: row.primary_subject || '', phone: row.phone || '', email: row.email || '',
      branch: row.branch || '', joined: row.joined_date || '', avatar: row.avatar || '',
      status: row.status || 'Active',
    }),
  },
  classes: {
    table: 'classes',
    toRow: (r, institute_id) => ({
      institute_id, id: String(r.id), name: String(r.name || 'Unnamed class'),
      grade: cleanText(r.grade), subject: cleanText(r.subject), teacher: cleanText(r.teacher),
      weekday: cleanText(r.day || r.weekday), start_time: cleanText(r.startTime),
      end_time: cleanText(r.endTime), schedule_text: cleanText(r.time), room: cleanText(r.room),
      capacity: Math.max(0, Math.trunc(cleanNumber(r.capacity, 0))),
      enrolled: Math.max(0, Math.trunc(cleanNumber(r.enrolled, 0))),
      monthly_fee: Math.max(0, cleanNumber(r.monthlyFee ?? r.fee)),
      delivery_type: cleanText(r.type), status: String(r.status || 'Active'), raw_data: r,
    }),
    fromRow: (row) => ({
      ...raw(row), id: row.id, name: row.name, grade: row.grade || '', subject: row.subject || '',
      teacher: row.teacher || '', day: row.weekday || '', startTime: row.start_time || '',
      endTime: row.end_time || '', time: row.schedule_text || '', room: row.room || '',
      capacity: row.capacity ?? 0, enrolled: row.enrolled ?? 0,
      monthlyFee: cleanNumber(row.monthly_fee), fee: cleanNumber(row.monthly_fee),
      type: row.delivery_type || '', status: row.status || 'Active',
    }),
  },
  attendance: {
    table: 'attendance_records',
    toRow: (r, institute_id) => ({
      institute_id, id: String(r.id), student_id: cleanText(r.studentId),
      student_name: String(r.name || r.student || 'Unknown student'), grade: cleanText(r.grade),
      class_id: cleanText(r.classId), class_name: cleanText(r.className || r.class),
      teacher: cleanText(r.teacher), attendance_date: cleanDate(r.date) || new Date().toISOString().slice(0, 10),
      attendance_time: cleanText(r.time), status: String(r.status || 'Present'),
      notes: cleanText(r.notes), raw_data: r,
    }),
    fromRow: (row) => ({
      ...raw(row), id: row.id, studentId: row.student_id || '', name: row.student_name,
      grade: row.grade || '', classId: row.class_id || '', className: row.class_name || '',
      teacher: row.teacher || '', date: row.attendance_date, time: row.attendance_time || '',
      status: row.status, notes: row.notes || '',
    }),
  },
  fees: {
    table: 'fee_payments',
    toRow: (r, institute_id) => ({
      institute_id, id: String(r.id), student_id: cleanText(r.studentId),
      student_name: String(r.student || r.studentName || 'Unknown student'), teacher: cleanText(r.teacher),
      subject: cleanText(r.subject), class_id: cleanText(r.classId), month_label: cleanText(r.month),
      amount: Math.max(0, cleanNumber(r.amount)), payment_date: cleanDate(r.date || r.paymentDate),
      payment_time: cleanText(r.time), method: cleanText(r.method),
      status: String(r.status || 'Paid'), receipt_number: cleanText(r.receiptNumber || r.receipt),
      notes: cleanText(r.notes), raw_data: r,
    }),
    fromRow: (row) => ({
      ...raw(row), id: row.id, studentId: row.student_id || '', student: row.student_name,
      teacher: row.teacher || '', subject: row.subject || '', classId: row.class_id || '',
      month: row.month_label || '', amount: cleanNumber(row.amount), date: row.payment_date || '',
      time: row.payment_time || '', method: row.method || '', status: row.status,
      receiptNumber: row.receipt_number || '', notes: row.notes || '',
    }),
  },
  exams: {
    table: 'exams',
    toRow: (r, institute_id) => ({
      institute_id, id: String(r.id), name: String(r.name || 'Unnamed exam'),
      class_name: cleanText(r.class), teacher: cleanText(r.teacher), exam_date: cleanDate(r.date),
      exam_time: cleanText(r.time), exam_type: cleanText(r.type), duration: cleanText(r.duration),
      total_marks: r.marks == null || r.marks === '' ? null : cleanNumber(r.marks),
      venue: cleanText(r.venue), status: String(r.status || 'Scheduled'),
      notes: cleanText(r.notes), raw_data: r,
    }),
    fromRow: (row) => ({
      ...raw(row), id: row.id, name: row.name, class: row.class_name || '',
      teacher: row.teacher || '', date: row.exam_date || '', time: row.exam_time || '',
      type: row.exam_type || '', duration: row.duration || '',
      marks: row.total_marks == null ? '' : String(row.total_marks), venue: row.venue || '',
      status: row.status || 'Scheduled', notes: row.notes || '',
    }),
  },
};

export async function loadInstituteStore(instituteId: string, role: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  // Fee records are intentionally limited to finance-capable roles by RLS.
  // Skip the query for other roles so one denied table cannot block sign-in.
  const canReadFees = ['super_admin', 'admin', 'manager', 'accountant'].includes(role);
  const names = (Object.keys(configs) as CollectionName[]).filter((name) => name !== 'fees' || canReadFees);
  const results = await Promise.all(names.map(async (name) => {
    const config = configs[name];
    const { data, error } = await supabase!.from(config.table).select('*').eq('institute_id', instituteId);
    if (error) throw new Error(`Could not load ${name}: ${error.message}`);
    return [name, (data || []).map((row) => config.fromRow(row))] as const;
  }));
  return { students: [], teachers: [], classes: [], attendance: [], fees: [], exams: [], ...Object.fromEntries(results) } as Record<CollectionName, EduPeakRecord[]>;
}


async function syncNormalizedClassEnrollments(instituteId: string) {
  if (!supabase) return;
  const [{ data: studentRows, error: studentError }, { data: classRows, error: classError }, { data: currentLinks, error: linksError }] = await Promise.all([
    supabase.from('students').select('id, raw_data').eq('institute_id', instituteId),
    supabase.from('classes').select('id').eq('institute_id', instituteId),
    supabase.from('student_class_enrollments').select('student_id, class_id').eq('institute_id', instituteId),
  ]);
  if (studentError) throw studentError;
  if (classError) throw classError;
  if (linksError) throw linksError;

  const classIds = new Set((classRows || []).map((row) => String(row.id)));
  const desired = new Map<string, Record<string, unknown>>();
  for (const student of studentRows || []) {
    const assignments = Array.isArray(student.raw_data?.classAssignments) ? student.raw_data.classAssignments : [];
    for (const assignment of assignments) {
      const classId = String(assignment?.classId || '').trim();
      if (!classId || !classIds.has(classId)) continue;
      const key = `${student.id}::${classId}`;
      const isFree = Boolean(assignment.free);
      desired.set(key, {
        institute_id: instituteId,
        student_id: String(student.id),
        class_id: classId,
        enrolled_on: cleanDate(assignment.enrolledOn || student.raw_data?.regDate) || new Date().toISOString().slice(0, 10),
        is_free: isFree,
        is_half_card: !isFree && Boolean(assignment.half || assignment.halfCard),
        status: String(assignment.status || 'Active'),
        raw_data: assignment,
      });
    }
  }

  const desiredKeys = new Set(desired.keys());
  const stale = (currentLinks || []).filter((link) => !desiredKeys.has(`${link.student_id}::${link.class_id}`));
  const enrollmentRows = [...desired.values()];
  for (let offset = 0; offset < enrollmentRows.length; offset += 250) {
    const { error } = await supabase.from('student_class_enrollments').upsert(
      enrollmentRows.slice(offset, offset + 250),
      { onConflict: 'institute_id,student_id,class_id' },
    );
    if (error) throw error;
  }
  for (const link of stale) {
    const { error } = await supabase.from('student_class_enrollments').delete()
      .eq('institute_id', instituteId)
      .eq('student_id', link.student_id)
      .eq('class_id', link.class_id);
    if (error) throw error;
  }
}

const writeQueues = new Map<string, Promise<unknown>>();
const lastSyncedSnapshots = new Map<string, EduPeakRecord[]>();

const cloneRecords = (records: EduPeakRecord[]) => JSON.parse(JSON.stringify(records || [])) as EduPeakRecord[];

// Seed the successful-cloud baseline after login. If a write fails, the next
// edit compares against this baseline and retries every outstanding change.
export function rememberInstituteSnapshots(
  instituteId: string,
  workspace: Record<CollectionName, EduPeakRecord[]>,
) {
  (Object.keys(configs) as CollectionName[]).forEach((collection) => {
    lastSyncedSnapshots.set(`${instituteId}:${collection}`, cloneRecords(workspace[collection] || []));
  });
}

export function syncCollectionDelta(
  collection: CollectionName,
  instituteId: string,
  previous: EduPeakRecord[],
  next: EduPeakRecord[],
) {
  if (!supabase) return Promise.resolve();
  const queueKey = `${instituteId}:${collection}`;
  const previousQueue = writeQueues.get(queueKey) || Promise.resolve();
  const operation = previousQueue.catch(() => undefined).then(async () => {
    const config = configs[collection];
    const snapshotKey = queueKey;
    const baseline = lastSyncedSnapshots.get(snapshotKey) || previous || [];
    const before = new Map((baseline || []).map((record) => [String(record.id), record]));
    const after = new Map((next || []).map((record) => [String(record.id), record]));
    const changed = [...after.values()].filter((record) => {
      if (record.id == null || String(record.id).trim() === '') return false;
      return JSON.stringify(before.get(String(record.id))) !== JSON.stringify(record);
    });
    const removed = [...before.keys()].filter((id) => !after.has(id));

    // Keep network payloads moderate for CSV/backup imports containing many rows.
    for (let offset = 0; offset < changed.length; offset += 250) {
      const rows = changed.slice(offset, offset + 250).map((record) => config.toRow(record, instituteId));
      const { error } = await supabase!.from(config.table).upsert(rows, { onConflict: 'institute_id,id' });
      if (error) throw new Error(`Could not save ${collection}: ${error.message}`);
    }
    for (let offset = 0; offset < removed.length; offset += 250) {
      const batch = removed.slice(offset, offset + 250);
      const { error } = await supabase!.from(config.table).delete()
        .eq('institute_id', instituteId).in('id', batch);
      if (error) throw new Error(`Could not delete ${collection}: ${error.message}`);
    }
    if (collection === 'students' || collection === 'classes') {
      await syncNormalizedClassEnrollments(instituteId);
    }
    lastSyncedSnapshots.set(snapshotKey, cloneRecords(next || []));
  });
  writeQueues.set(queueKey, operation);
  return operation;
}

export async function loadMembership(userId: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('institute_memberships')
    .select('institute_id, role, status')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('This login does not have an active EduPeak institute membership. Ask the Super Administrator to grant access.');
  return data;
}

export async function loadUserProfile(userId: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase
    .from('user_profiles')
    .select('username, full_name, email')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export function uiRole(role: string) {
  const labels: Record<string, string> = {
    super_admin: 'Super Administrator', admin: 'Administrator', manager: 'Manager',
    registrar: 'Registrar', teacher: 'Teacher', accountant: 'Accountant',
    attendance_staff: 'Attendance Staff', viewer: 'Viewer',
  };
  return labels[role] || 'Viewer';
}

export type EduPeakSupabaseClient = SupabaseClient;

export async function loadInstituteSettings(instituteId: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.from('institute_settings').select('settings').eq('institute_id', instituteId).maybeSingle();
  if (error) throw error;
  return data?.settings || null;
}

export async function saveInstituteSettings(instituteId: string, settings: Record<string, unknown>) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const institute = (settings as any)?.institute || {};
  const { error: settingsError } = await supabase.from('institute_settings').upsert(
    { institute_id: instituteId, settings },
    { onConflict: 'institute_id' },
  );
  if (settingsError) throw new Error(`Could not save institute settings: ${settingsError.message}`);
  const update = {
    name: cleanText(institute.name) || 'EduPeak Institute',
    registration_number: cleanText(institute.registrationNumber),
    address: cleanText(institute.address),
    phone: cleanText(institute.phone),
    email: cleanText(institute.email),
  };
  const { error: instituteError } = await supabase.from('institutes').update(update).eq('id', instituteId);
  if (instituteError) throw new Error(`Could not update institute profile: ${instituteError.message}`);

  const branches = Array.isArray((settings as any)?.branches) ? (settings as any).branches : [];
  const branchRows = branches.filter((branch: any) => branch?.id && branch?.name).map((branch: any) => ({
    institute_id: instituteId,
    id: String(branch.id),
    name: String(branch.name),
    address: cleanText(branch.address),
    phone: cleanText(branch.phone),
    status: String(branch.status || 'Active'),
    raw_data: branch,
  }));
  if (branchRows.length) {
    const { error } = await supabase.from('branches').upsert(branchRows, { onConflict: 'institute_id,id' });
    if (error) throw new Error(`Could not save branches: ${error.message}`);
  }
  const { data: existingBranches, error: branchReadError } = await supabase.from('branches')
    .select('id').eq('institute_id', instituteId);
  if (branchReadError) throw branchReadError;
  const retainedIds = new Set(branchRows.map((branch: any) => branch.id));
  const removedIds = (existingBranches || []).map((branch) => branch.id).filter((id) => !retainedIds.has(id));
  if (removedIds.length) {
    const { error } = await supabase.from('branches').delete().eq('institute_id', instituteId).in('id', removedIds);
    if (error) throw new Error(`Could not remove deleted branches: ${error.message}`);
  }
}
