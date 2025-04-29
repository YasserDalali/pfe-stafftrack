// Utility function to log attendance to Supabase
import sb from '../database/supabase-client';

export const logAttendance = async (employeeId, confidence) => {
  try {
    console.log('🔄 Logging attendance for employee:', employeeId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check for existing attendance today
    const { data: existingAttendance, error: checkError } = await sb
      .from('attendance')
      .select('id, checkdate')
      .eq('employee_id', employeeId)
      .gte('checkdate', today.toISOString())
      .lt('checkdate', tomorrow.toISOString())
      .limit(1);

    if (checkError) {
      console.error('❌ Error checking attendance:', checkError);
      throw checkError;
    }

    if (existingAttendance?.length > 0) {
      console.log('ℹ️ Attendance already logged for today');
      return false;
    }

    const now = new Date();
    const startTime = new Date(now);
    startTime.setHours(9, 0, 0, 0);

    const lateness = now > startTime ? Math.floor((now - startTime) / (1000 * 60)) : 0;

    // Insert new attendance record
    const { data: insertResult, error: insertError } = await sb
      .from('attendance')
      .insert([
        {
          employee_id: employeeId,
          checkdate: now.toISOString(),
          status: 'present',
          lateness: lateness > 0 ? `${lateness} minutes` : null,
          confidence_score: confidence,
        },
      ])
      .select();

    if (insertError) {
      console.error('❌ Error inserting attendance:', insertError);
      throw insertError;
    }

    console.log('✅ Successfully logged attendance');
    return true;
  } catch (error) {
    console.error('❌ Error in logAttendance:', error);
    return false;
  }
};