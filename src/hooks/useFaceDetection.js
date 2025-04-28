import { useState, useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
/* import sb from '../database/supabase-client';
import fs from 'fs';
import path from 'path'; */
import { fetchEmployeeData } from '../utils/fetchEmployeeData';
import { logAttendance } from '../utils/logAttendance';
import { checkFaceQuality } from '../utils/checkFaceQuality';

const useFaceDetection = (threshold = 0.4) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const descriptorsRef = useRef({});
  const employeeDataRef = useRef({}); // Store employee data for attendance logging
  
  // Store detection results for API
  const [detectionResults, setDetectionResults] = useState({
    sessions: [], // Array of detection sessions
    totalDetections: 0,
    lastUpdate: null,
    verifiedUsers: new Set(), // Unique verified users
  });

  // Configuration for stricter detection
  const CONFIG = {
    MIN_CONFIDENCE: 0.5, // Reduced from 0.8 for easier detection
    MIN_FACE_SIZE: 80,  // Reduced minimum face size
    REQUIRED_CONSECUTIVE_DETECTIONS: 2, // Reduced for faster recognition
    DETECTION_INTERVAL: 100,
    MAX_ANGLE: 25, // Increased angle tolerance
    MIN_BRIGHTNESS: 0.3, // Reduced brightness requirement
    MIN_FACE_SCORE: 0.3, // Reduced minimum face score
    MAX_DETECTION_DISTANCE: 0.7, // Increased distance threshold
    MIN_LANDMARKS_VISIBILITY: 0,
  };

  // Track consecutive detections
  const consecutiveDetectionsRef = useRef({});

  // Track consecutive successful detections
  const updateConsecutiveDetections = (personId, match) => {
    const currentTime = Date.now();
    
    // Reset if too much time has passed
    if (consecutiveDetectionsRef.current[personId]?.lastDetection &&
        currentTime - consecutiveDetectionsRef.current[personId].lastDetection > 2000) {
      consecutiveDetectionsRef.current[personId] = {
        count: 1,
        lastDetection: currentTime,
        averageDistance: match.distance
      };
      return false;
    }

    if (!consecutiveDetectionsRef.current[personId]) {
      consecutiveDetectionsRef.current[personId] = {
        count: 1,
        lastDetection: currentTime,
        averageDistance: match.distance
      };
      return false;
    }

    const current = consecutiveDetectionsRef.current[personId];
    current.count += 1;
    current.lastDetection = currentTime;
    current.averageDistance = (current.averageDistance * (current.count - 1) + match.distance) / current.count;

    // Check if we have enough consistent detections
    return current.count >= CONFIG.REQUIRED_CONSECUTIVE_DETECTIONS &&
           current.averageDistance <= CONFIG.MAX_DETECTION_DISTANCE;
  };

  // Store detection result
  const storeDetectionResult = async (detection, match) => {
    console.log('🎯 Detection result:', {
      label: match.label,
      confidence: match.confidence,
      threshold: 0.7
    });

    // Only attempt to log attendance if confidence is high enough
    if (match.confidence > 0.7) {
      console.log('✨ Confidence threshold met, attempting to log attendance');
      const attendanceLogged = await logAttendance(match.label, match.confidence);
      
      if (attendanceLogged) {
        console.log('📝 Attendance logged successfully, updating UI');
        const timestamp = new Date().toISOString();

        setDetectionResults(prev => {
          const newSession = {
            timestamp,
            userId: match.label,
            confidence: match.confidence,
            faceLocation: detection.detection.box,
            detectionType: 'FACE_RECOGNITION',
            deviceInfo: {
              userAgent: navigator.userAgent,
              timestamp: Date.now(),
            }
          };

          return {
            ...prev,
            sessions: [...prev.sessions, newSession],
            totalDetections: prev.totalDetections + 1,
            lastUpdate: timestamp,
            verifiedUsers: new Set([...prev.verifiedUsers, match.label])
          };
        });

        setAttendance(prev => {
          const exists = prev.some(entry => entry.attender === match.label);
          if (!exists) {
            return [...prev, {
              attender: match.label,
              timestamp,
              confidence: match.confidence,
              verified: true
            }];
          }
          return prev;
        });
      } else {
        console.log('ℹ️ Attendance logging skipped (already logged or error occurred)');
      }
    } else {
      console.log('⚠️ Confidence too low to log attendance:', match.confidence);
    }
  };

  useEffect(() => {
    const loadModels = async () => {
      try {
        await Promise.all([
          faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        ]);
        await startVideo();
        
        // Load reference images from Supabase
        const referenceImages = await fetchEmployeeData();
        await loadReferenceProfiles(referenceImages);
      } catch (error) {
        console.error('Error loading models:', error);
      } finally {
        setLoading(false);
      }
    };

    loadModels();
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startVideo = async () => {
    try {
      // First get list of available video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');

      console.log('Available video devices:', videoDevices); // Debug available devices

      // Try to use the last device in the list (usually external webcam)
      // If not available, fall back to default
      const deviceId = videoDevices.length > 1 ? videoDevices[videoDevices.length - 1].deviceId : undefined;

      const constraints = {
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          facingMode: "user",
          frameRate: { ideal: 10 }
        }
      };

      console.log('Using video constraints:', constraints); // Debug selected constraints

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play().catch(err => {
            console.error('Error playing video:', err);
          });
        };
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      // Try fallback to any available camera
      try {
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play();
        }
      } catch (fallbackError) {
        console.error('Fallback camera also failed:', fallbackError);
      }
    }
  };

  const loadReferenceProfiles = async (referenceImages) => {
    for (const [name, images] of Object.entries(referenceImages)) {
      try {
        const descriptors = await Promise.all(
          images.map(async (imageUrl) => {
            try {
              const img = await faceapi.fetchImage(imageUrl);
              const detection = await faceapi
                .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: CONFIG.MIN_CONFIDENCE }))
                .withFaceLandmarks()
                .withFaceDescriptor();
              return detection?.descriptor;
            } catch (error) {
              console.error(`Error processing image for ${name}:`, error);
              return null;
            }
          })
        );
        
        const validDescriptors = descriptors.filter(Boolean);
        if (validDescriptors.length > 0) {
          descriptorsRef.current[name] = validDescriptors;
        }
      } catch (error) {
        console.error(`Error loading reference image for ${name}:`, error);
      }
    }
  };

  useEffect(() => {
    if (!loading && videoRef.current) {
      const interval = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return;

        try {
          const detections = await faceapi
            .detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options({ 
              minConfidence: CONFIG.MIN_CONFIDENCE,
              maxResults: 1
            }))
            .withFaceLandmarks()
            .withFaceDescriptors();

          if (!detections.length) {
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            return;
          }

          const canvas = canvasRef.current;
          const displaySize = { 
            width: videoRef.current.videoWidth, 
            height: videoRef.current.videoHeight 
          };
          
          faceapi.matchDimensions(canvas, displaySize);
          const resizedDetections = faceapi.resizeResults(detections, displaySize);

          const context = canvas.getContext('2d');
          context.clearRect(0, 0, canvas.width, canvas.height);

          for (const detection of resizedDetections) {
            const qualityCheck = checkFaceQuality(detection, videoRef.current);
            
            // Draw face landmarks for better visualization
            const landmarks = detection.landmarks;
            const drawLandmarks = new faceapi.draw.DrawFaceLandmarks(landmarks);
            drawLandmarks.draw(canvas);

            if (!qualityCheck.isValid) {
              // Draw red box with reason
              const drawBox = new faceapi.draw.DrawBox(detection.detection.box, {
                label: qualityCheck.reason,
                boxColor: '#ff0000',
                drawLabelOptions: {
                  fontSize: 16,
                  fontStyle: 'bold',
                  padding: 10
                }
              });
              drawBox.draw(canvas);
              continue;
            }

            let bestMatch = { label: 'Unknown', distance: 1 };
            let matchCount = 0;
            let totalDistance = 0;

            // Find best match with averaging
            for (const [name, descriptors] of Object.entries(descriptorsRef.current)) {
              for (const referenceDescriptor of descriptors) {
                const distance = faceapi.euclideanDistance(detection.descriptor, referenceDescriptor);
                if (distance < CONFIG.MAX_DETECTION_DISTANCE) {
                  matchCount++;
                  totalDistance += distance;
                  if (distance < bestMatch.distance) {
                    bestMatch = { label: name, distance };
                  }
                }
              }
            }

            // Calculate average confidence for this match
            const averageDistance = matchCount > 0 ? totalDistance / matchCount : 1;
            const confidence = 1 - averageDistance;

            // Only proceed if we have a good match
            if (bestMatch.label !== 'Unknown' && confidence > 0.6) {
              if (updateConsecutiveDetections(bestMatch.label, bestMatch)) {
                // Draw green box with name above
                const boxWithText = {
                  ...detection.detection.box,
                  y: detection.detection.box.y - 30 // Move label above the box
                };
                
                // Draw name label background
                context.fillStyle = 'rgba(0, 255, 0, 0.3)';
                context.fillRect(
                  boxWithText.x - 5,
                  boxWithText.y - 5,
                  context.measureText(bestMatch.label).width + 10,
                  30
                );

                // Draw box
                const drawBox = new faceapi.draw.DrawBox(detection.detection.box, {
                  label: `${bestMatch.label} (${(confidence * 100).toFixed(1)}%)`,
                  boxColor: '#00ff00',
                  drawLabelOptions: {
                    fontSize: 16,
                    fontStyle: 'bold',
                    padding: 10
                  }
                });
                drawBox.draw(canvas);

                // Log attendance if confidence is high enough
                if (confidence > 0.7) {
                  await storeDetectionResult(detection, {
                    ...bestMatch,
                    confidence
                  });
                }
              }
            } else {
              // Draw yellow box for unknown face
              const drawBox = new faceapi.draw.DrawBox(detection.detection.box, {
                label: 'Unknown Person',
                boxColor: '#ffff00',
                drawLabelOptions: {
                  fontSize: 16,
                  fontStyle: 'bold',
                  padding: 10
                }
              });
              drawBox.draw(canvas);
            }
          }
        } catch (error) {
          console.error('Error during face detection:', error);
        }
      }, CONFIG.DETECTION_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [loading, threshold]);

  return {
    videoRef,
    canvasRef,
    attendance,
    loading,
    detectionResults, // Now returning detection results for API use
  };
};

export default useFaceDetection;