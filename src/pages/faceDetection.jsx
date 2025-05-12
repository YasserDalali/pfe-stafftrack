import React, { useRef, useState, useEffect } from 'react';
import useFaceDetection from "../hooks/useFaceDetection";
import LoadingSpinner from "../components/LoadingSpinner";
import EnhancedReportModal from "../components/EnhancedReportModal";
import { generateEnhancedReport } from "../utils/enhancedReportGenerator";

function FaceDetection() {
  const referenceImages = {
    Yasser_Dalali: ['/labels/Yasser_Dalali/1.jpg', '/labels/Yasser_Dalali/2.jpg'],
    Hamza_Idehmad: ['/labels/Hamza_Idehmad/1.jpg', '/labels/Hamza_Idehmad/2.jpg'],
    Reda_Aitlhssen: ['/labels/Reda_Aitlhssen/1.jpg'],
    Zakaria_Benjeddi: ['/labels/Zakaria_Benjeddi/1.jpg'],
  };

  // Keep track of attendance records with their screenshots
  const [attendanceWithScreenshots, setAttendanceWithScreenshots] = useState([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const { videoRef, canvasRef, attendance, loading, isProcessing, resetProcessingState } = useFaceDetection();

  // Function to capture screenshot from video
  const captureScreenshot = () => {
    const video = videoRef.current;
    if (!video) return null;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg');
  };

  // Update attendanceWithScreenshots when attendance changes
  useEffect(() => {
    if (attendance && attendance.length > attendanceWithScreenshots.length) {
      // Only capture screenshot for new attendance records
      const newRecord = attendance[attendance.length - 1];
      const screenshot = captureScreenshot();

      setAttendanceWithScreenshots(prev => {
        const updatedAttendance = [
          ...prev,
          {
            ...newRecord,
            screenshot
          }
        ];
        
        // Signal that processing is complete after state update
        // We use setTimeout to ensure state update completes first
        setTimeout(() => {
          resetProcessingState();
          console.log('✅ Attendance record processed, detection resumed');
        }, 500);
        
        return updatedAttendance;
      });
    }
  }, [attendance, resetProcessingState]);

  // Cleanup function to stop the video stream
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      if (video && video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoRef]);

  // Get the most recent attendance log
  const latestRecord = attendanceWithScreenshots[attendanceWithScreenshots.length - 1];

  const handleDeviceSelect = (deviceId) => {
    if (videoRef.current && videoRef.current.srcObject) {
      // Stop current stream
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());

      // Start new stream with selected device
      navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } }
      }).then(stream => {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      });
    }
  };

  const handleGenerateReport = async () => {
    try {
      setIsReportModalOpen(true);
      setIsGeneratingReport(true);
      setReportData(null);
      
      const report = await generateEnhancedReport();
      setReportData(report);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Failed to generate report. Please try again later.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className="app bg-black">
      
      {loading && <LoadingSpinner />}
      <video
        ref={videoRef}
        className="rounded-3xl px-5"
        autoPlay
        style={{ width: "100vw", height: "100vh" }}
      />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
        }}
      />
      {isProcessing && (
        <div className="absolute top-5 right-5 bg-yellow-500 text-white px-3 py-1 rounded-md shadow-lg">
          Processing...
        </div>
      )}
      
      {/* Generate Report Button */}
      <button
        onClick={handleGenerateReport}
        className="absolute top-5 left-5 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-lg flex items-center transition-colors"
        disabled={isGeneratingReport}
      >
        {isGeneratingReport ? (
          <>
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Generate HR Report
          </>
        )}
      </button>
      
      <table className="absolute bottom-10 left-[6%] z-20 bg-white border rounded-lg border-gray-300 shadow-lg w-[90%]">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 text-left font-medium text-gray-700">Employee</th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Time</th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Accuracy</th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Status</th>
            <th className="px-4 py-2 text-left font-medium text-gray-700">Screenshot</th>
          </tr>
        </thead>
        <tbody>
          {latestRecord && (
            <tr className="bg-white hover:bg-gray-100">
              <td className="px-4 py-2 text-gray-800">
                {latestRecord.name ? latestRecord.name.replace('_', ' ') : 
                 latestRecord.employeeId ? latestRecord.employeeId.replace('_', ' ') : 'Unknown'}
              </td>
              <td className="px-4 py-2 text-gray-800">
                {new Date(latestRecord.timestamp).toLocaleTimeString()}
              </td>
              <td
                className={`px-4 py-2 font-semibold ${latestRecord.confidence > 0.6
                    ? "text-green-600"
                    : "text-red-600"
                  }`}
              >
                {latestRecord.confidence > 0.6 ? "Accurate" : "Inaccurate"}
              </td>
              <td className="px-4 py-2 text-gray-800">
                {new Date(latestRecord.timestamp) > new Date().setHours(4, 30, 0, 0) ? "LATE" : "ON TIME"}
              </td>
              <td className="px-4 py-2">
                {latestRecord.screenshot && (
                  <img
                    src={latestRecord.screenshot}
                    alt={`Screenshot of ${latestRecord.name || latestRecord.employeeId || 'Unknown'}`}
                    className="w-24 h-24 object-cover rounded-md"
                  />
                )}
              </td>
            </tr>
          )}
        </tbody>
      </table>
      
      {/* Enhanced Report Modal */}
      <EnhancedReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        reportData={reportData}
        loading={isGeneratingReport}
      />
    </div>
  );
}

export default FaceDetection;
