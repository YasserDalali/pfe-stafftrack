import { useState, useEffect, useRef } from "react";
import * as faceapi from "face-api.js";
/* import sb from '../database/supabase-client';
import fs from 'fs';
import path from 'path'; */
import { fetchEmployeeData } from '../utils/fetchEmployeeData';
import { logAttendance } from '../utils/logAttendance';
import { checkFaceQuality } from '../utils/checkFaceQuality';
import { downloadAndProcessImage, loadEmployeePhotos, getEmployeeIdFromFilename } from '../utils/storageUtils';
import { initializeFaceApi, detectFace, calculateFaceMatch, CONFIG } from '../utils/faceDetectionUtils';
import { getEmployeeData } from '../utils/databaseUtils';

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

        // Load employee photos from Supabase storage
        const photos = await loadEmployeePhotos();
        
        // Process each photo and store descriptors
        for (const photo of photos) {
          const employeeId = getEmployeeIdFromFilename(photo.name);
          const img = await downloadAndProcessImage(photo.name);
          
          if (img) {
            const detection = await detectFace(img);
            if (detection?.descriptor) {
              if (!descriptorsRef.current[employeeId]) {
                descriptorsRef.current[employeeId] = [];
              }
              descriptorsRef.current[employeeId].push(detection.descriptor);
            }
          }
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
          
          if (match.confidence > 0.6) {
            // Draw green box for recognized face
            new faceapi.draw.DrawBox(resizedDetection.detection.box, {
              label: `${match.label} (${(match.confidence * 100).toFixed(1)}%)`,
              boxColor: '#00ff00'
            }).draw(canvas);

            // Log attendance if confidence is high enough
            if (match.confidence > 0.7) {
              const logged = await logAttendance(match.label, match.confidence, {
                box: resizedDetection.detection.box,
                landmarks: resizedDetection.landmarks.positions,
                descriptor: Array.from(detection.descriptor)
              });

              if (logged) {
                setAttendance(prev => [
                  ...prev,
                  {
                    employeeId: match.label,
                    timestamp: new Date().toISOString(),
                    confidence: match.confidence
                  }
                ]);
              }
            }
          } else {
            // Draw yellow box for unknown face
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