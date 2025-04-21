class Leave {
  static async create({ employee_id, start_date, end_date, reason, type, status }) {
    try {
      const result = await mcp_supabase_execute_sql({
        project_id: "zfkdqglvibuxgjexkall",
        query: `
          INSERT INTO leaves (employee_id, start_date, end_date, reason, type, status)
          VALUES (${employee_id}, '${start_date}', '${end_date}', '${reason}', '${type}', '${status}')
          RETURNING *;
        `
      });
      
      return result?.data?.[0];
    } catch (error) {
      console.error('Error creating leave:', error);
      throw error;
    }
  }

  static async findByEmployeeAndDateRange(employee_id, start_date, end_date) {
    try {
      const result = await mcp_supabase_execute_sql({
        project_id: "zfkdqglvibuxgjexkall",
        query: `
          SELECT * FROM leaves 
          WHERE employee_id = ${employee_id}
          AND (
            (start_date BETWEEN '${start_date}' AND '${end_date}')
            OR (end_date BETWEEN '${start_date}' AND '${end_date}')
            OR (start_date <= '${start_date}' AND end_date >= '${end_date}')
          );
        `
      });
      
      return result?.data || [];
    } catch (error) {
      console.error('Error finding leaves:', error);
      throw error;
    }
  }

  static async getAll() {
    try {
      const result = await mcp_supabase_execute_sql({
        project_id: "zfkdqglvibuxgjexkall",
        query: `SELECT * FROM leaves ORDER BY start_date DESC;`
      });
      
      return result?.data || [];
    } catch (error) {
      console.error('Error getting all leaves:', error);
      throw error;
    }
  }
}

export default Leave; 