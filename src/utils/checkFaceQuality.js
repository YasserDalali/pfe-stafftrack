// Hardcoded value for MIN_FACE_SIZE to address the error
export const checkFaceQuality = (detection, videoElement) => {
  const CONFIG = {
    MIN_FACE_SIZE: 80, // Hardcoded value
    MIN_FACE_SCORE: 0.3,
    MAX_ANGLE: 25,
    MIN_LANDMARKS_VISIBILITY: 0,
  };

  const { width, height, score } = detection.detection.box;

  console.log('Face detection quality:', {
    score,
    width,
    height,
    minRequired: CONFIG.MIN_FACE_SIZE,
  });

  // Check detection score
  if (score < CONFIG.MIN_FACE_SCORE) {
    console.log('Failed quality check: Low detection confidence', score);
    return { isValid: false, reason: 'Low detection confidence' };
  }

  // Check face size
  if (width < CONFIG.MIN_FACE_SIZE || height < CONFIG.MIN_FACE_SIZE) {
    console.log('Failed quality check: Face too small', { width, height });
    return { isValid: false, reason: 'Face too small or too far' };
  }

  // Check face angle
  const landmarks = detection.landmarks;
  const leftEye = landmarks.getLeftEye();
  const rightEye = landmarks.getRightEye();
  const nose = landmarks.getNose();

  // Check if nose points are visible (detect partial face coverage)
  const nosePoints = nose.length;
  const visibleNosePoints = nose.filter(
    (point) =>
      point.x >= 0 &&
      point.x <= videoElement.width &&
      point.y >= 0 &&
      point.y <= videoElement.height
  ).length;

  const visibilityRatio = visibleNosePoints / nosePoints;
  console.log('Face visibility ratio:', visibilityRatio);

  if (visibilityRatio < CONFIG.MIN_LANDMARKS_VISIBILITY) {
    console.log('Failed quality check: Face partially covered');
    return { isValid: false, reason: 'Face partially covered' };
  }

  // Check face angle
  const angle = Math.abs(
    Math.atan2(
      rightEye[0].y - leftEye[0].y,
      rightEye[0].x - leftEye[0].x
    ) * (180 / Math.PI)
  );

  console.log('Face angle:', angle);

  if (angle > CONFIG.MAX_ANGLE) {
    console.log('Failed quality check: Face angle too large', angle);
    return { isValid: false, reason: 'Face not aligned properly' };
  }

  // Check face symmetry (detect partial face)
  const leftSide = landmarks.getJawOutline().slice(0, 8);
  const rightSide = landmarks.getJawOutline().slice(8);
  const symmetryRatio =
    Math.abs(leftSide.length - rightSide.length) / leftSide.length;

  console.log('Face symmetry ratio:', symmetryRatio);

  if (symmetryRatio > 0.2) {
    console.log('Failed quality check: Face asymmetry too high', symmetryRatio);
    return { isValid: false, reason: 'Face partially visible' };
  }

  return { isValid: true };
};