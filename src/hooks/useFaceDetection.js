import { useState, useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
/* import sb from '../database/supabase-client';
import fs from 'fs';
import path from 'path'; */
import { logAttendance } from '../utils/logAttendance';
import { buildEmployeeFaceDescriptors } from '../utils/storageUtils';
import { initializeFaceApi, detectFace, calculateFaceMatch } from '../utils/faceDetectionUtils';
import CONFIG from '../utils/CONFIG';
import { getSettings } from '../utils/settingsUtils';

const useFaceDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const descriptorsRef = useRef({});
  const consecutiveDetectionsRef = useRef({});
  const settingsRef = useRef(CONFIG);

  // Initialize face detection
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load user settings from localStorage if available
        settingsRef.current = getSettings();
        console.log('📝 Loaded settings for face detection');

        // Load face-api models
        const modelsLoaded = await initializeFaceApi();
        if (!modelsLoaded) {
          throw new Error('Failed to load face-api models');
        }

        // Start video
        await startVideo();

        // Load employee face descriptors
        console.log('🔄 Loading employee face descriptors');
        const employeeDescriptors = await buildEmployeeFaceDescriptors();
        
        if (Object.keys(employeeDescriptors).length === 0) {
          console.log('⚠️ No valid employee face descriptors found');
        } else {
          console.log('✅ Loaded face descriptors for', Object.keys(employeeDescriptors).length, 'employees');
          descriptorsRef.current = employeeDescriptors;
        }

        setLoading(false);
      } catch (error) {
        console.error('Initialization error:', error);
        setLoading(false);
      }
    };

    initialize();

    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startVideo = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const deviceId = videoDevices.length > 1 ? videoDevices[videoDevices.length - 1].deviceId : undefined;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: deviceId ? { exact: deviceId } : undefined,
          width: { min: 640, ideal: 1280, max: 1920 },
          height: { min: 480, ideal: 720, max: 1080 },
          facingMode: "user",
          frameRate: { ideal: 10 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
    }
  };

  // Face detection loop
  useEffect(() => {
    if (!loading && videoRef.current) {
      const interval = setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        // Skip processing if we're still handling the previous detection
        if (isProcessing) {
          console.log('⏳ Detection paused - processing previous detection');
          return;
        }

        try {
          const detection = await detectFace(videoRef.current);
          
          if (!detection) {
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
          const resizedDetection = faceapi.resizeResults(detection, displaySize);

          // Draw face detection results
          const context = canvas.getContext('2d');
          context.clearRect(0, 0, canvas.width, canvas.height);

          // Calculate match
          const match = calculateFaceMatch(detection.descriptor, descriptorsRef.current);
          
          // Use settings from localStorage or CONFIG defaults
          const settings = settingsRef.current;

          if (match.confidence > settings.RECOGNITION_THRESHOLD) {
            // Draw green box for recognized face
            const employeeName = match.name || 'Unknown';
            new faceapi.draw.DrawBox(resizedDetection.detection.box, {
              label: `${employeeName} (${(match.confidence * 100).toFixed(1)}%)`,
              boxColor: '#00ff00'
            }).draw(canvas);

            // Set processing flag to pause detection while handling this match
            setIsProcessing(true);

            // Log attendance 
            const logged = await logAttendance(match.label, match.confidence);

            if (logged) {
              setAttendance(prev => [
                ...prev,
                {
                  employeeId: match.label,
                  name: match.name,
                  timestamp: new Date().toISOString(),
                  confidence: match.confidence
                }
              ]);
            }
            
            // Add a small delay to allow the parent component to process the new attendance record
            // before resuming detection
            setTimeout(() => {
              setIsProcessing(false);
            }, 1000); // 1 second delay to ensure processing completes
          } else {
            // Draw yellow box for unknown face or low confidence
            new faceapi.draw.DrawBox(resizedDetection.detection.box, {
              label: 'Unknown',
              boxColor: '#ffff00'
            }).draw(canvas);
          }

        } catch (error) {
          console.error('Error during face detection:', error);
          setIsProcessing(false); // Ensure processing flag is cleared on error
        }
      }, settingsRef.current.DETECTION_INTERVAL); // Use the DETECTION_INTERVAL from settings

      return () => clearInterval(interval);
    }
  }, [loading, isProcessing]); // Added isProcessing as dependency

  // Function to manually reset processing state from parent component
  const resetProcessingState = () => {
    setIsProcessing(false);
  };

  return {
    videoRef,
    canvasRef,
    attendance,
    loading,
    isProcessing,
    resetProcessingState
  };
};

export default useFaceDetection;