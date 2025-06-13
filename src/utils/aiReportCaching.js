// Cache key for storing AI report data
const REPORT_CACHE_KEY = 'ai_report_cache';

/**
 * Get cached report data
 * @returns {Object} The cached data or empty object if no cache exists
 */
export const getReportCache = () => {
    try {
        const cacheData = localStorage.getItem(REPORT_CACHE_KEY);
        if (!cacheData) return {};
        return JSON.parse(cacheData);
    } catch (error) {
        console.error('Error reading cache:', error);
        return {};
    }
};

/**
 * Save report data to cache
 * @param {Object} data - The report data to cache
 * @param {Object} employeeData - The employee data used to generate the report
 */
export const saveReportCache = (data, employeeData) => {
    try {
        const cache = {
            timestamp: Date.now(),
            data,
            employeeDataHash: JSON.stringify(employeeData)
        };
        localStorage.setItem(REPORT_CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
        console.error('Error saving cache:', error);
    }
};

/**
 * Check if cached data is valid
 * @param {Object} cache - The cache object to validate
 * @param {Object} currentData - Current employee data to compare against cache
 * @returns {boolean} Whether the cache is valid
 */
export const isCacheValid = (cache, currentData) => {
    try {
        if (!cache || !cache.timestamp || !cache.data || !cache.employeeDataHash) {
            return false;
        }
        
        // Check if cache is less than 24 hours old
        const cacheAge = Date.now() - cache.timestamp;
        const MAX_CACHE_AGE = 24 * 60 * 60 * 1000; // 24 hours
        if (cacheAge > MAX_CACHE_AGE) {
            return false;
        }

        // Check if employee data has changed
        return cache.employeeDataHash === JSON.stringify(currentData);
    } catch (error) {
        console.error('Error validating cache:', error);
        return false;
    }
};
