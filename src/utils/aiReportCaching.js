const REPORT_CACHE_KEY = 'ai_report_cache';

// Helper function to get cache data
export const getReportCache = () => {
    try {
        return JSON.parse(localStorage.getItem(REPORT_CACHE_KEY) || '{}');
    } catch {
        return {};
    }
};

// Helper function to save cache data
export const saveReportCache = (data, employeeData) => {
    const cache = {
        timestamp: Date.now(),
        data,
        employeeDataHash: JSON.stringify(employeeData)
    };
    localStorage.setItem(REPORT_CACHE_KEY, JSON.stringify(cache));
};

// Helper function to check if cache is valid
export const isCacheValid = (cache, currentData) => {
    if (!cache.timestamp || !cache.data || !cache.employeeDataHash) return false;
    // Check if employee data has changed
    return cache.employeeDataHash === JSON.stringify(currentData);
};
