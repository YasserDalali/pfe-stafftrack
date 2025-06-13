import { GoogleGenerativeAI } from "@google/generative-ai";
import sb from '../database/supabase-client';
import { jsPDF } from "jspdf";
import html2canvas from 'html2canvas';

// Get employee and attendance data
const fetchEmployeeAndAttendanceData = async () => {
  try {
    console.log('🔄 Enhanced report: Fetching employee data...');
    // Fetch employees
    const { data: employees, error: employeeError } = await sb
      .from('employees')
      .select('*');

    console.log('🔄 Enhanced report: Fetching attendance data with employee names...');
    // Fetch attendance with employee names using join
    const { data: attendance, error: attendanceError } = await sb
      .from('attendance')
      .select(`
        id,
        employee_id,
        checkdate,
        status,
        confidence_score,
        employees(name, departement, position)
      `)
      .order('checkdate', { ascending: false });

    if (employeeError) {
      console.error('❌ Enhanced report: Employee query error:', employeeError);
      throw employeeError;
    }
    if (attendanceError) {
      console.error('❌ Enhanced report: Attendance query error:', attendanceError);
      throw attendanceError;
    }

    console.log('✅ Enhanced report: Successfully fetched:', employees?.length || 0, 'employees and', attendance?.length || 0, 'attendance records');

    // Transform attendance data to include employee names directly
    const attendanceWithNames = attendance.map(record => ({
      ...record,
      employee_name: record.employees?.name || 'Unknown Employee',
      employee_department: record.employees?.departement || 'Unknown Department',
      employee_position: record.employees?.position || 'Unknown Position'
    }));

    // Get last 30 days of data for trends
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentAttendance = attendanceWithNames.filter(record => 
      new Date(record.checkdate) >= thirtyDaysAgo
    );

    console.log('📊 Enhanced report: Recent attendance (30 days):', recentAttendance?.length || 0, 'records');

    return { 
      employees, 
      attendance: attendanceWithNames, 
      recentAttendance 
    };
  } catch (error) {
    console.error('Error fetching data for report:', error);
    return { employees: [], attendance: [], recentAttendance: [] };
  }
};

// Get API key from environment variables
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

// Enhanced JSON schema for the AI response
const REPORT_SCHEMA = {
  "attendanceSummary": {
    "totalEmployees": 0,
    "averageDailyAttendance": 0,
    "attendanceRate": 0,
    "latenessRate": 0
  },
  "timeAnalysis": {
    "averageArrivalTime": "",
    "mostCommonArrivalTimeRange": "",
    "peakAttendanceDays": []
  },
  "employeeInsights": {
    "mostPunctual": [],
    "frequentlyLate": [],
    "perfectAttendance": [],
    "irregularPatterns": []
  },
  "departmentComparison": {
    "bestPerformingDept": "",
    "improvementNeededDept": "",
    "departmentStats": []
  },
  "trendsAndPatterns": {
    "monthlyTrend": "",
    "weekdayPatterns": "",
    "weatherImpact": "",
    "seasonalFactors": ""
  },
  "riskAssessment": {
    "highRiskEmployees": [],
    "earlyWarningIndications": [],
    "attritionRiskFactors": ""
  },
  "actionableRecommendations": {
    "policyAdjustments": [],
    "employeeSpecificInterventions": [],
    "workforceManagementTips": [],
    "recognitionOpportunities": []
  },
  "executiveSummary": "",
  "reportMetadata": {
    "generatedDate": "",
    "dataCoverage": "",
    "confidenceScore": 0
  }
};

// Generate an enhanced AI report
export const generateEnhancedReport = async () => {
  try {
    // Fetch required data
    const { employees, attendance, recentAttendance } = await fetchEmployeeAndAttendanceData();
    
    if (!employees.length || !attendance.length) {
      throw new Error('Insufficient data to generate report');
    }

    // Create the AI model instance
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Calculate some basic stats to guide the AI
    const totalEmployees = employees.length;
    const uniqueAttendanceDays = [...new Set(attendance.map(a => a.checkdate))].length;
    const expectedAttendanceRecords = totalEmployees * uniqueAttendanceDays;
    const attendanceRate = (attendance.length / expectedAttendanceRecords * 100).toFixed(2);
    
    // Enhanced prompt with more HR-specific directions
    const prompt = `As an expert HR Analyst, generate a comprehensive attendance report using the following data.

EMPLOYEE DATA: ${JSON.stringify(employees)}
ATTENDANCE DATA: ${JSON.stringify(attendance)}
RECENT ATTENDANCE (30 DAYS): ${JSON.stringify(recentAttendance)}

ANALYSIS PARAMETERS:
- Today's Date: ${new Date().toISOString().split('T')[0]}
- Total Employees: ${totalEmployees}
- Attendance Rate: ~${attendanceRate}%
- Data Period: ${attendance.length > 0 ? attendance[attendance.length-1].checkdate : 'N/A'} to ${attendance.length > 0 ? attendance[0].checkdate : 'N/A'}

CRITICAL INSTRUCTIONS:
- ALWAYS use employee NAMES (not IDs) in all lists and recommendations
- Each attendance record includes employee_name, employee_department, and employee_position
- When mentioning employees, use their actual names like "John Smith" not employee IDs
- Include department and position information where relevant

REPORT REQUIREMENTS:
1. Follow HR best practices and emphasize data-driven insights
2. Focus on actionable recommendations that can improve attendance
3. Identify trends, patterns, and anomalies in attendance data
4. Highlight high-risk employees and departments BY NAME
5. Provide specific intervention strategies for different employee categories
6. Include both quantitative metrics and qualitative insights
7. Consider factors like time of year, day of week, and external factors
8. Suggest policy adjustments based on attendance patterns

Return ONLY a valid JSON object with this exact structure (no markdown, no backticks, no json keyword):
${JSON.stringify(REPORT_SCHEMA, null, 2)}

Keep your analysis concise yet thorough, with a professional tone suitable for HR executives. Remember: USE EMPLOYEE NAMES, NOT IDs in all output.`;

    // Generate the content
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean and parse the response
    const cleanJson = responseText
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .trim();

    try {
      const response = JSON.parse(cleanJson);
      
      // Add generation timestamp if missing
      if (!response.reportMetadata.generatedDate) {
        response.reportMetadata.generatedDate = new Date().toISOString();
      }
      
      return response;
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      throw new Error('Invalid response format from AI');
    }
  } catch (error) {
    console.error("Error generating enhanced AI report:", error);
    throw error;
  }
};

// Generate PDF from report data
export const generateReportPDF = async (reportData, includeCharts = true) => {
  try {
    // Dynamic import to ensure autoTable is loaded
    await import('jspdf-autotable');
    
    const doc = new jsPDF();
    
    // Check if autoTable is available
    if (typeof doc.autoTable !== 'function') {
      console.warn('autoTable not available, generating simple PDF');
      return generateSimplePDF(reportData);
    }
    
    // Add company logo and header
    doc.setFontSize(22);
    doc.setTextColor(44, 62, 80);
    doc.text("HR Attendance Analysis Report", 105, 20, { align: "center" });
    
    // Add report generation date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const dateText = `Generated on: ${new Date(reportData.reportMetadata.generatedDate).toLocaleString()}`;
    doc.text(dateText, 105, 30, { align: "center" });
    
    // Executive Summary
    doc.setFontSize(16);
    doc.setTextColor(44, 62, 80);
    doc.text("Executive Summary", 14, 45);
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const splitSummary = doc.splitTextToSize(reportData.executiveSummary, 180);
    doc.text(splitSummary, 14, 55);
    
    // Attendance Summary section
    const startY = 55 + splitSummary.length * 5;
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text("Attendance Summary", 14, startY);
    
    const summaryData = [
      ["Total Employees", reportData.attendanceSummary.totalEmployees],
      ["Average Daily Attendance", reportData.attendanceSummary.averageDailyAttendance],
      ["Attendance Rate", `${reportData.attendanceSummary.attendanceRate}%`],
      ["Lateness Rate", `${reportData.attendanceSummary.latenessRate}%`]
    ];
    
    doc.autoTable({
      startY: startY + 5,
      head: [["Metric", "Value"]],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [52, 73, 94], textColor: 255 },
      styles: { fontSize: 10 }
    });
    
    // Employee Insights
    let currentY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text("Employee Insights", 14, currentY);
    
    // Most Punctual Employees
    currentY += 10;
    doc.setFontSize(12);
    doc.setTextColor(39, 174, 96);
    doc.text("Most Punctual Employees", 14, currentY);
    
    const punctualData = reportData.employeeInsights.mostPunctual.map(emp => [emp]);
    
    doc.autoTable({
      startY: currentY + 5,
      body: punctualData,
      theme: 'grid',
      styles: { fontSize: 10 }
    });
    
    // Frequently Late Employees
    currentY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(231, 76, 60);
    doc.text("Frequently Late Employees", 14, currentY);
    
    const lateData = reportData.employeeInsights.frequentlyLate.map(emp => [emp]);
    
    doc.autoTable({
      startY: currentY + 5,
      body: lateData,
      theme: 'grid',
      styles: { fontSize: 10 }
    });
    
    // Add new page for recommendations
    doc.addPage();
    
    // Actionable Recommendations
    doc.setFontSize(16);
    doc.setTextColor(44, 62, 80);
    doc.text("Actionable Recommendations", 14, 20);
    
    // Policy Adjustments
    doc.setFontSize(12);
    doc.setTextColor(41, 128, 185);
    doc.text("Policy Adjustments", 14, 35);
    
    const policyData = reportData.actionableRecommendations.policyAdjustments.map(rec => [rec]);
    
    doc.autoTable({
      startY: 40,
      body: policyData,
      theme: 'grid',
      styles: { fontSize: 10 }
    });
    
    // Employee Specific Interventions
    currentY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(41, 128, 185);
    doc.text("Employee Specific Interventions", 14, currentY);
    
    const interventionData = reportData.actionableRecommendations.employeeSpecificInterventions.map(rec => [rec]);
    
    doc.autoTable({
      startY: currentY + 5,
      body: interventionData,
      theme: 'grid',
      styles: { fontSize: 10 }
    });
    
    // Workforce Management Tips
    currentY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setTextColor(41, 128, 185);
    doc.text("Workforce Management Tips", 14, currentY);
    
    const tipsData = reportData.actionableRecommendations.workforceManagementTips.map(tip => [tip]);
    
    doc.autoTable({
      startY: currentY + 5,
      body: tipsData,
      theme: 'grid',
      styles: { fontSize: 10 }
    });
    
    // Footer with metadata
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Data Coverage: ${reportData.reportMetadata.dataCoverage} | Confidence Score: ${reportData.reportMetadata.confidenceScore}`, 105, 285, { align: 'center' });
      doc.text(`Page ${i} of ${pageCount}`, 195, 285, { align: 'right' });
    }
    
    return doc;
  } catch (error) {
    console.error("Error generating PDF:", error);
    console.log("Falling back to simple PDF generation");
    return generateSimplePDF(reportData);
  }
};

// Fallback simple PDF generation without tables
const generateSimplePDF = (reportData) => {
  try {
    const doc = new jsPDF();
    let yPos = 20;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(44, 62, 80);
    doc.text("HR Attendance Analysis Report", 105, yPos, { align: "center" });
    yPos += 20;
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const dateText = `Generated on: ${new Date(reportData.reportMetadata.generatedDate).toLocaleString()}`;
    doc.text(dateText, 105, yPos, { align: "center" });
    yPos += 20;
    
    // Executive Summary
    doc.setFontSize(16);
    doc.setTextColor(44, 62, 80);
    doc.text("Executive Summary", 14, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const splitSummary = doc.splitTextToSize(reportData.executiveSummary, 180);
    doc.text(splitSummary, 14, yPos);
    yPos += splitSummary.length * 5 + 15;
    
    // Attendance Summary
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text("Attendance Summary", 14, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(`Total Employees: ${reportData.attendanceSummary.totalEmployees}`, 14, yPos);
    yPos += 6;
    doc.text(`Average Daily Attendance: ${reportData.attendanceSummary.averageDailyAttendance}`, 14, yPos);
    yPos += 6;
    doc.text(`Attendance Rate: ${reportData.attendanceSummary.attendanceRate}%`, 14, yPos);
    yPos += 6;
    doc.text(`Lateness Rate: ${reportData.attendanceSummary.latenessRate}%`, 14, yPos);
    yPos += 15;
    
    // Most Punctual Employees
    doc.setFontSize(12);
    doc.setTextColor(39, 174, 96);
    doc.text("Most Punctual Employees", 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    reportData.employeeInsights.mostPunctual.forEach(emp => {
      doc.text(`• ${emp}`, 20, yPos);
      yPos += 5;
    });
    yPos += 10;
    
    // Frequently Late Employees
    doc.setFontSize(12);
    doc.setTextColor(231, 76, 60);
    doc.text("Frequently Late Employees", 14, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    reportData.employeeInsights.frequentlyLate.forEach(emp => {
      doc.text(`• ${emp}`, 20, yPos);
      yPos += 5;
    });
    yPos += 10;
    
    // Add new page for recommendations if needed
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }
    
    // Recommendations
    doc.setFontSize(14);
    doc.setTextColor(44, 62, 80);
    doc.text("Actionable Recommendations", 14, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    reportData.actionableRecommendations.policyAdjustments.forEach(rec => {
      const splitRec = doc.splitTextToSize(`• ${rec}`, 180);
      doc.text(splitRec, 20, yPos);
      yPos += splitRec.length * 5 + 2;
    });
    
    return doc;
  } catch (error) {
    console.error("Error generating simple PDF:", error);
    throw error;
  }
};

// Export PDF file for download
export const downloadReportPDF = (doc, filename = "hr-attendance-report.pdf") => {
  try {
    doc.save(filename);
    return true;
  } catch (error) {
    console.error("Error downloading PDF:", error);
    return false;
  }
}; 