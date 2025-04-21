class Employee {
  static async getAll() {
    try {
      const result = await mcp_supabase_execute_sql({
        project_id: "zfkdqglvibuxgjexkall",
        query: `SELECT * FROM employees ORDER BY name;`
      });
      
      return result?.data || [];
    } catch (error) {
      console.error('Error getting employees:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await mcp_supabase_execute_sql({
        project_id: "zfkdqglvibuxgjexkall",
        query: `SELECT * FROM employees WHERE id = ${id};`
      });
      
      return result?.data?.[0];
    } catch (error) {
      console.error('Error finding employee:', error);
      throw error;
    }
  }

  static async updateLeaveBalance(id, newBalance) {
    try {
      const result = await mcp_supabase_execute_sql({
        project_id: "zfkdqglvibuxgjexkall",
        query: `
          UPDATE employees 
          SET leave_balance = ${newBalance} 
          WHERE id = ${id}
          RETURNING *;
        `
      });
      
      return result?.data?.[0];
    } catch (error) {
      console.error('Error updating leave balance:', error);
      throw error;
    }
  }
}

export default Employee; 