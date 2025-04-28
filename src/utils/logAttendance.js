// Utility function to log attendance to Supabase
import sb from '../database/supabase-client';

export const logAttendance = async (employeeDataRef, employeeName, confidence) => {
  try {
    const employeeData = employeeDataRef.current[employeeName];
    if (!employeeData) {
      console.error('Employee data not found:', employeeName);
      return false;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: existingAttendance, error: checkError } = await sb
      .from('attendance')
      .select('id, checkdate')
      .eq('employee_id', employeeData.id)
      .gte('checkdate', today.toISOString())
      .lt('checkdate', tomorrow.toISOString())
      .limit(1);

    if (checkError) {
      console.error('Error checking attendance:', checkError);
      throw checkError;
    }

    if (existingAttendance.length > 0) {
      console.log(`Attendance already logged for ${employeeName}`);
      return false;
    }

    const now = new Date();
    const startTime = new Date(now);
    startTime.setHours(9, 0, 0, 0);

    const lateness = now > startTime ? Math.floor((now - startTime) / (1000 * 60)) : 0;

    const { data: insertResult, error: insertError } = await sb
      .from('attendance')
      .insert([
        {
          employee_id: employeeData.id,
          checkdate: now.toISOString(),
          status: lateness > 0 ? 'late' : 'on_time',
          lateness: lateness > 0 ? `${lateness} minutes` : null,
        },
      ])
      .select();

    if (insertError) {
      console.error('Error inserting attendance:', insertError);
      throw insertError;
    }

    console.log(`Successfully logged attendance for ${employeeName}`);
    return true;
  } catch (error) {
    console.error('Error in logAttendance:', error);
    return false;
  }
};