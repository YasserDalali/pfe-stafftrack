import supabase from '../database/supabase-client';

export const logAttendance = async (employeeId, confidence, detection) => {
  try {
    console.log('🔄 Checking recent attendance for employee:', employeeId);
    // Check if attendance was already logged in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const { data: existingAttendance } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('timestamp', oneHourAgo.toISOString())
      .limit(1);

    if (existingAttendance?.length > 0) {
      console.log('⚠️ Attendance already logged within the last hour for:', employeeId);
      console.log('⏰ Previous attendance:', {
        timestamp: existingAttendance[0].timestamp,
        confidence: existingAttendance[0].confidence
      });
      return false;
    }

    console.log('📝 Logging new attendance for:', employeeId);
    console.log('📊 Confidence:', (confidence * 100).toFixed(1) + '%');

    // Log new attendance
    const { data, error } = await supabase
      .from('attendance')
      .insert([
        {
          employee_id: employeeId,
          confidence: confidence,
          detection_data: detection,
          device_info: {
            userAgent: navigator.userAgent,
            timestamp: Date.now()
          }
        }
      ]);

    if (error) {
      console.error('❌ Error logging attendance:', error);
      return false;
    }

    console.log('✅ Attendance logged successfully for:', employeeId);
    return true;
  } catch (error) {
    console.error('❌ Error in logAttendance:', error);
    return false;
  }
};

export const getEmployeeData = async () => {
  try {
    console.log('🔄 Fetching employee data');
    const { data, error } = await supabase
      .from('employees')
      .select('*');

    if (error) {
      console.error('❌ Error fetching employee data:', error);
      return [];
    }

    console.log('✅ Employee data fetched:', {
      count: data.length,
      employees: data.map(e => ({
        id: e.id,
        name: e.name
      }))
    });

    return data;
  } catch (error) {
    console.error('❌ Error in getEmployeeData:', error);
    return [];
  }
}; 