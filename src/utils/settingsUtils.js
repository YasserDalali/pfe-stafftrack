import CONFIG from './CONFIG';

export const SETTINGS_STORAGE_KEY = 'face_detection_settings';

/**
 * Get settings from localStorage, falling back to CONFIG defaults
 * @returns {Object} The settings object with values from localStorage or CONFIG defaults
 */
export const getSettings = () => {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      return { ...CONFIG, ...JSON.parse(savedSettings) };
    }
  } catch (error) {
    console.error('Error loading settings from localStorage:', error);
  }
  return CONFIG;
};

/**
 * Save settings to localStorage
 * @param {Object} settings - The settings object to save
 * @returns {boolean} Whether the save was successful
 */
export const saveSettings = (settings) => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving settings to localStorage:', error);
    return false;
  }
};

/**
 * Reset settings to CONFIG defaults
 * @returns {Object} The default CONFIG settings
 */
export const resetSettings = () => {
  try {
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  } catch (error) {
    console.error('Error removing settings from localStorage:', error);
  }
  return CONFIG;
};

/**
 * Descriptions and metadata for settings
 */
export const settingsInfo = {
  MIN_CONFIDENCE: {
    title: "Minimum Confidence",
    description: "How sure the system needs to be that it's seeing a face. Higher values mean fewer false detections but might miss some real faces.",
    icon: "shield",
    color: "blue",
    min: 0,
    max: 1,
    step: 0.05,
    type: "range"
  },
  RECOGNITION_THRESHOLD: {
    title: "Recognition Confidence",
    description: "How confident the system needs to be to identify a person. Higher values require closer matches to the stored face images.",
    icon: "user",
    color: "green",
    min: 0,
    max: 1,
    step: 0.05,
    type: "range"
  },
  LATE_THRESHOLD_HOUR: {
    title: "Late Hour Threshold",
    description: "The hour when employees are considered late (24-hour format).",
    icon: "clock",
    color: "orange",
    min: 0,
    max: 23,
    step: 1,
    type: "number"
  },
  LATE_THRESHOLD_MINUTE: {
    title: "Late Minute Threshold",
    description: "The minute when employees are considered late.",
    icon: "clock",
    color: "orange",
    min: 0,
    max: 59,
    step: 1,
    type: "number"
  },
  MIN_FACE_SIZE: {
    title: "Minimum Face Size",
    description: "The smallest size of face that can be detected (in pixels). Lower values detect faces from further away.",
    icon: "zoom-in",
    color: "purple",
    min: 20,
    max: 200,
    step: 5,
    type: "number"
  },
  REQUIRED_CONSECUTIVE_DETECTIONS: {
    title: "Required Consecutive Detections",
    description: "How many times in a row a face must be detected to confirm identity. Higher values reduce false matches but take longer.",
    icon: "activity",
    color: "red",
    min: 1,
    max: 10,
    step: 1,
    type: "number"
  },
  DETECTION_INTERVAL: {
    title: "Detection Interval",
    description: "How often the system checks for faces (in milliseconds). Lower values are more responsive but use more resources.",
    icon: "refresh-cw",
    color: "indigo",
    min: 100,
    max: 5000,
    step: 100,
    type: "number"
  },
  MAX_ANGLE: {
    title: "Maximum Face Angle",
    description: "The maximum angle a face can be tilted and still be recognized (in degrees). Higher values allow more flexibility but may increase false matches.",
    icon: "sliders",
    color: "yellow",
    min: 0,
    max: 90,
    step: 5,
    type: "number"
  },
  MIN_BRIGHTNESS: {
    title: "Minimum Brightness",
    description: "The minimum light level needed for reliable face detection. Lower values work in dimmer lighting but may increase errors.",
    icon: "sun",
    color: "yellow",
    min: 0,
    max: 1,
    step: 0.05,
    type: "range"
  },
  MIN_FACE_SCORE: {
    title: "Minimum Face Quality Score",
    description: "The minimum quality a detected face must have. Higher values ensure better quality detections.",
    icon: "target",
    color: "blue",
    min: 0,
    max: 1,
    step: 0.05,
    type: "range"
  },
  MAX_DETECTION_DISTANCE: {
    title: "Maximum Detection Distance",
    description: "How far a person can be from the camera (as a relative measure). Higher values detect faces from further away.",
    icon: "ruler",
    color: "gray",
    min: 0,
    max: 2,
    step: 0.1,
    type: "range"
  },
  MIN_LANDMARKS_VISIBILITY: {
    title: "Minimum Facial Landmarks Visibility",
    description: "How visible facial features need to be for detection. Lower values work better when face is partially obscured.",
    icon: "target",
    color: "green",
    min: 0,
    max: 1,
    step: 0.05,
    type: "range"
  }
}; 