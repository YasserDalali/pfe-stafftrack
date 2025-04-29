import * as faceapi from 'face-api.js';

export const CONFIG = {
  MIN_CONFIDENCE: 0.5,
  RECOGNITION_THRESHOLD: 0.5,
  MIN_FACE_SIZE: 80,
  REQUIRED_CONSECUTIVE_DETECTIONS: 2,
  DETECTION_INTERVAL: 1000,
  MAX_ANGLE: 25,
  MIN_BRIGHTNESS: 0.3,
  MIN_FACE_SCORE: 0.3,
  MAX_DETECTION_DISTANCE: 0.7,
  MIN_LANDMARKS_VISIBILITY: 0,
};

export const initializeFaceApi = async () => {
  try {
    console.log('🔄 Loading face-api models...');
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/models')
    ]);
    console.log('✅ Face-api models loaded successfully');
    return true;
  } catch (error) {
    console.error('❌ Error loading face-api models:', error);
    return false;
  }
};

export const detectFace = async (image) => {
  try {
    console.log('🔍 Starting face detection on image');
    console.time('faceDetection');
    
    const detection = await faceapi
      .detectSingleFace(image, new faceapi.SsdMobilenetv1Options({ 
        minConfidence: CONFIG.MIN_CONFIDENCE 
      }))
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    console.timeEnd('faceDetection');

    if (!detection) {
      console.log('⚠️ No face detected in image');
      return null;
    }

    console.log('✅ Face detected:', {
      confidence: detection.detection.score,
      box: detection.detection.box,
      landmarks: 'Found',
      descriptor: 'Generated'
    });

    return detection;
  } catch (error) {
    console.error('❌ Error detecting face:', error);
    return null;
  }
};

export const calculateFaceMatch = (descriptor, referenceDescriptors) => {
  console.log('🔄 Starting face matching process');
  
  if (!referenceDescriptors || Object.keys(referenceDescriptors).length === 0) {
    console.log('⚠️ No reference descriptors available');
    return { label: 'Unknown', distance: 1, confidence: 0, averageConfidence: 0 };
  }

  console.log('📊 Number of reference descriptors:', Object.keys(referenceDescriptors).length);
  
  let bestMatch = { label: 'Unknown', distance: 1, confidence: 0 };
  let matchCount = 0;
  let totalDistance = 0;
  let allMatches = [];

  // Iterate through each employee's descriptors
  for (const [employeeId, employeeData] of Object.entries(referenceDescriptors)) {
    console.log(`\n👤 Comparing with employee ${employeeData.name} (ID: ${employeeId}):`);
    console.log(`📸 Number of reference descriptors:`, employeeData.descriptors.length);
    
    let bestDistanceForEmployee = 1;
    
    // Compare with each descriptor for this employee
    for (const referenceDescriptor of employeeData.descriptors) {
      const distance = faceapi.euclideanDistance(descriptor, referenceDescriptor);
      console.log(`📏 Distance:`, distance.toFixed(3));
      
      if (distance < CONFIG.MAX_DETECTION_DISTANCE) {
        matchCount++;
        totalDistance += distance;
        if (distance < bestDistanceForEmployee) {
          bestDistanceForEmployee = distance;
        }
      }
    }
    
    allMatches.push({
      employeeId,
      name: employeeData.name,
      bestDistance: bestDistanceForEmployee,
      confidence: 1 - bestDistanceForEmployee
    });

    if (bestDistanceForEmployee < bestMatch.distance) {
      bestMatch = { 
        label: employeeId,
        name: employeeData.name,
        distance: bestDistanceForEmployee,
        confidence: 1 - bestDistanceForEmployee
      };
    }
  }

  // Calculate average confidence
  const averageDistance = matchCount > 0 ? totalDistance / matchCount : 1;
  bestMatch.averageConfidence = 1 - averageDistance;

  console.log('\n📊 Matching Results:');
  console.log('🏆 Best Match:', {
    employeeId: bestMatch.label,
    name: bestMatch.name,
    confidence: (bestMatch.confidence * 100).toFixed(1) + '%',
    averageConfidence: (bestMatch.averageConfidence * 100).toFixed(1) + '%'
  });
  
  console.log('📈 All Matches:', allMatches
    .sort((a, b) => b.confidence - a.confidence)
    .map(m => ({
      employeeId: m.employeeId,
      name: m.name,
      confidence: (m.confidence * 100).toFixed(1) + '%'
    }))
  );

  return bestMatch;
}; 