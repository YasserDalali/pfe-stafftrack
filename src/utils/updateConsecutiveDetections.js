// Utility function to update consecutive detections
export const updateConsecutiveDetections = (consecutiveDetectionsRef, personId, match, CONFIG) => {
  const currentTime = Date.now();

  // Reset if too much time has passed
  if (
    consecutiveDetectionsRef.current[personId]?.lastDetection &&
    currentTime - consecutiveDetectionsRef.current[personId].lastDetection > 2000
  ) {
    consecutiveDetectionsRef.current[personId] = {
      count: 1,
      lastDetection: currentTime,
      averageDistance: match.distance,
    };
    return false;
  }

  if (!consecutiveDetectionsRef.current[personId]) {
    consecutiveDetectionsRef.current[personId] = {
      count: 1,
      lastDetection: currentTime,
      averageDistance: match.distance,
    };
    return false;
  }

  const current = consecutiveDetectionsRef.current[personId];
  current.count += 1;
  current.lastDetection = currentTime;
  current.averageDistance =
    (current.averageDistance * (current.count - 1) + match.distance) / current.count;

  // Check if we have enough consistent detections
  return (
    current.count >= CONFIG.REQUIRED_CONSECUTIVE_DETECTIONS &&
    current.averageDistance <= CONFIG.MAX_DETECTION_DISTANCE
  );
};