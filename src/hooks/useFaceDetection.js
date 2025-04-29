import { useState, useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
/* import sb from '../database/supabase-client';
import fs from 'fs';
import path from 'path'; */
import { logAttendance } from '../utils/logAttendance';
import { buildEmployeeFaceDescriptors } from '../utils/storageUtils';
import { initializeFaceApi, detectFace, calculateFaceMatchm  } from '../utils/faceDetectionUtils';
import CONFIG from '../utils/CONFIG';
const useFaceDetection = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [attendance, setAttendance] = useState([]);
  const descriptorsRef = useRef({});
  const consecutiveDetectionsRef = useRef({});

  // Initialize face detection
  useEffect(() => {
    const initialize = async () => {
      try {
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
          
          // Use a consistent threshold from CONFIG
          // const recognitionThreshold = 0.5; // Removed local variable

          if (match.confidence > CONFIG.RECOGNITION_THRESHOLD) { // Use CONFIG.RECOGNITION_THRESHOLD
            // Draw green box for recognized face
            const employeeName = match.name || 'Unknown';
            new faceapi.draw.DrawBox(resizedDetection.detection.box, {
              label: `${employeeName} (${(match.confidence * 100).toFixed(1)}%)`,
              boxColor: '#00ff00'
            }).draw(canvas);

            // Log attendance 
            // (No separate confidence check needed here now)
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
          } else {
            // Draw yellow box for unknown face or low confidence
            new faceapi.draw.DrawBox(resizedDetection.detection.box, {
              label: 'Unknown',
              boxColor: '#ffff00'
            }).draw(canvas);
          }

        } catch (error) {
          console.error('Error during face detection:', error);
        }
      }, CONFIG.DETECTION_INTERVAL);

      return () => clearInterval(interval);
    }
  }, [loading]);

  return {
    videoRef,
    canvasRef,
    attendance,
    loading
  };
};

export default useFaceDetection;