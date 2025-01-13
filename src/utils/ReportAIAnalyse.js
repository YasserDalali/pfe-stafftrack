import { GoogleGenerativeAI } from "@google/generative-ai";

// Mock employee data
export const employeeRecords = [
    {
        employeeId: 101,
        name: "Alice Johnson",
        department: "Marketing",
        position: "Social Media Manager",
        wage: 4500,
        latenessRecords: [
            { date: "2025-01-01", minutesLate: 10 },
            { date: "2025-01-03", minutesLate: 15 },
            { date: "2025-01-07", minutesLate: 5 },
        ],
        overtimeHours: 12,
        daysAbsent: 1,
        projectRatings: [4.5, 4.7, 4.8],
        trainingHours: 8,
        satisfactionScore: 7.8,
        peerFeedback: 8.5,
        managerFeedback: 9.0,
        potentialAttritionRisk: 0.2,
    },
    {
        employeeId: 102,
        name: "Bob Smith",
        department: "Engineering",
        position: "Software Developer",
        wage: 6000,
        latenessRecords: [
            { date: "2025-01-02", minutesLate: 20 },
            { date: "2025-01-06", minutesLate: 30 },
        ],
        overtimeHours: 25,
        daysAbsent: 3,
        projectRatings: [4.0, 3.8, 4.2],
        trainingHours: 15,
        satisfactionScore: 6.5,
        peerFeedback: 7.0,
        managerFeedback: 6.8,
        potentialAttritionRisk: 0.4,
    },
    {
        employeeId: 103,
        name: "Catherine Lee",
        department: "HR",
        position: "HR Specialist",
        wage: 5000,
        latenessRecords: [
            { date: "2025-01-04", minutesLate: 5 },
        ],
        overtimeHours: 5,
        daysAbsent: 0,
        projectRatings: [4.9, 4.8, 4.7],
        trainingHours: 20,
        satisfactionScore: 9.0,
        peerFeedback: 9.2,
        managerFeedback: 9.5,
        potentialAttritionRisk: 0.1,
    },
    {
        employeeId: 104,
        name: "David Martinez",
        department: "Sales",
        position: "Sales Executive",
        wage: 5500,
        latenessRecords: [
            { date: "2025-01-05", minutesLate: 45 },
            { date: "2025-01-07", minutesLate: 20 },
        ],
        overtimeHours: 18,
        daysAbsent: 2,
        projectRatings: [3.5, 3.7, 3.9],
        trainingHours: 10,
        satisfactionScore: 5.5,
        peerFeedback: 6.0,
        managerFeedback: 5.8,
        potentialAttritionRisk: 0.6,
    },
    {
        employeeId: 105,
        name: "Evelyn Turner",
        department: "Finance",
        position: "Financial Analyst",
        wage: 7000,
        latenessRecords: [],
        overtimeHours: 8,
        daysAbsent: 0,
        projectRatings: [4.8, 4.9, 5.0],
        trainingHours: 25,
        satisfactionScore: 9.5,
        peerFeedback: 9.8,
        managerFeedback: 9.7,
        potentialAttritionRisk: 0.05,
    },
];

const genAI = new GoogleGenerativeAI("AIzaSyCSx4dD-DeaX6dqRtuqGMj5u_8qRU8qsDE");

export const generateAIReport = async () => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Analyze this employee data and provide insights focusing on:
1. High Attrition Risk: Identify employees with low satisfaction or poor feedback
2. Lateness Patterns: Correlate lateness with satisfaction
3. Training Effectiveness: Relate training hours to project performance
4. Workload Balance: Analyze overtime and absenteeism
5. Engagement Levels: Use satisfaction and feedback metrics

Data: ${JSON.stringify(employeeRecords)}

Return ONLY a valid JSON object with this structure (no markdown, no backticks, no json keyword):
{
  "highRiskEmployees": ["Employee Name 1", "Employee Name 2"],
  "latenessAnalysis": "Analysis text here",
  "trainingImpact": "Analysis text here",
  "workloadConcerns": "Analysis text here",
  "engagementSummary": "Analysis text here",
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean the response text by removing any markdown formatting
        const cleanJson = responseText
            .replace(/```json\s*/g, '')  // Remove ```json
            .replace(/```\s*/g, '')      // Remove remaining ```
            .trim();                     // Remove extra whitespace

        try {
            const response = JSON.parse(cleanJson);
            return response;
        } catch (parseError) {
            console.error('Failed to parse JSON:', cleanJson);
            throw new Error('Invalid JSON response from AI');
        }
    } catch (error) {
        console.error("Error generating AI report:", error);
        throw error;
    }
}; 