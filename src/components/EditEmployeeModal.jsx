import * as faceapi from 'face-api.js';
import React, { useState, useRef, useEffect } from 'react';
import supabase from '../database/supabase-client';
import { v4 as uuidv4 } from 'uuid';
import Webcam from 'react-webcam';
import { generateFaceDescriptor } from '../utils/storageUtils';

const EditEmployeeModal = ({ isOpen, onClose, employee, onEmployeeUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    departement: '',
    hire_date: '',
    monthly_salary: '',
    weekly_work_hours: '',
    notes: '',
    leave_balance: '',
    satisfaction_rate: '5',
    avatar_descriptor: null,
    avatar_url: null,
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isUsingWebcam, setIsUsingWebcam] = useState(false);
  const [faceDetectionError, setFaceDetectionError] = useState(null);
  const webcamRef = useRef(null);

  useEffect(() => {
    if (isOpen && employee) {
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        position: employee.position || '',
        departement: employee.departement || '',
        hire_date: employee.hire_date ? new Date(employee.hire_date).toISOString().split('T')[0] : '',
        monthly_salary: employee.monthly_salary || '',
        weekly_work_hours: employee.weekly_work_hours || '',
        notes: employee.notes || '',
        leave_balance: employee.leave_balance || '',
        satisfaction_rate: employee.satisfaction_rate?.toString() || '5',
        avatar_descriptor: employee.avatar_descriptor || null,
        avatar_url: employee.avatar_url || null,
      });
      setAvatarFile(null);
      setError(null);
      setFaceDetectionError(null);
      setIsUsingWebcam(false);
    }
  }, [isOpen, employee]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setAvatarFile(file);
      setFormData(prev => ({ ...prev, avatar_url: null }));
      setError(null);
      setFaceDetectionError(null);
    } else {
      setError('Please select a valid image file');
      setAvatarFile(null);
    }
  };

  const handleCaptureWebcam = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      const file = new File([blob], 'webcam-photo.png', { type: 'image/png' });
      setAvatarFile(file);
      setFormData(prev => ({ ...prev, avatar_url: null }));
      setIsUsingWebcam(false);
      setError(null);
      setFaceDetectionError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFaceDetectionError(null);

    if (!employee || !employee.id) {
      setError('Employee data is missing. Cannot update.');
      setLoading(false);
      return;
    }

    try {
      let newAvatarUrl = formData.avatar_url;
      let newAvatarDescriptor = formData.avatar_descriptor;
      let oldAvatarPath = null;

      if (avatarFile) {
         if (formData.avatar_url) {
           try {
             const urlParts = formData.avatar_url.split('/');
             oldAvatarPath = urlParts[urlParts.length - 1];
           } catch (e) {
             console.warn("Could not parse old avatar path for deletion:", formData.avatar_url);
           }
         }

        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('employee-avatars')
          .upload(filePath, avatarFile);

        if (uploadError) throw new Error(`Avatar upload failed: ${uploadError.message}`);

        const { data: urlData } = supabase.storage
          .from('employee-avatars')
          .getPublicUrl(filePath);
        newAvatarUrl = urlData.publicUrl;

         try {
            await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');
            await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
            await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
            const descriptor = await generateFaceDescriptor(avatarFile);
             if (!descriptor) {
               setFaceDetectionError('No face detected in the new image. Please use a clear face photo. Update proceeded without avatar change.');
               newAvatarUrl = formData.avatar_url;
               setAvatarFile(null);
             } else {
               newAvatarDescriptor = descriptor;
               console.log('👤 New avatar descriptor generated.');
             }
         } catch (faceError) {
           console.error("Face detection error:", faceError);
           setFaceDetectionError('Error processing face detection. Update proceeded without avatar change.');
           newAvatarUrl = formData.avatar_url;
           newAvatarDescriptor = formData.avatar_descriptor;
           setAvatarFile(null);
         }

      }

      const updateData = {
        ...formData,
        leave_balance: parseInt(formData.leave_balance) || 0,
        satisfaction_rate: parseInt(formData.satisfaction_rate) || 5,
        monthly_salary: parseFloat(formData.monthly_salary) || null,
        weekly_work_hours: parseFloat(formData.weekly_work_hours) || null,
        avatar_url: newAvatarUrl,
        avatar_descriptor: newAvatarDescriptor,
      };
       delete updateData.employee;

      const { data: updatedData, error: updateError } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', employee.id)
        .select();

      if (updateError) throw updateError;

      if (oldAvatarPath && newAvatarUrl !== formData.avatar_url) {
          console.log(`Attempting to delete old avatar: ${oldAvatarPath}`);
          const { error: deleteError } = await supabase.storage
              .from('employee-avatars')
              .remove([oldAvatarPath]);
          if (deleteError) {
              console.warn(`Failed to delete old avatar (${oldAvatarPath}):`, deleteError.message);
              setError(`Employee updated, but failed to remove old avatar: ${deleteError.message}`);
          } else {
               console.log(`Successfully deleted old avatar: ${oldAvatarPath}`);
          }
      }

      if (onEmployeeUpdated && updatedData) {
         onEmployeeUpdated(updatedData[0]);
      }
      onClose();

    } catch (err) {
       console.error("Update error:", err);
       if (!faceDetectionError) {
         setError(`Failed to update employee: ${err.message}`);
       }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-7xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 flex flex-col md:flex-row">

          <div className="flex-1 md:pr-6 mb-6 md:mb-0">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              Edit Employee
            </h2>

             {error && (
               <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-200 rounded-md text-sm">
                 {error}
               </div>
             )}
             {faceDetectionError && (
               <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-200 rounded-md text-sm">
                 {faceDetectionError}
               </div>
             )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                     Name *
                   </label>
                   <input
                     type="text"
                     name="name"
                     required
                     value={formData.name}
                     onChange={handleInputChange}
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                     Email *
                   </label>
                   <input
                     type="email"
                     name="email"
                     required
                     value={formData.email}
                     onChange={handleInputChange}
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                     Position
                   </label>
                   <input
                     type="text"
                     name="position"
                     value={formData.position}
                     onChange={handleInputChange}
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                     Department
                   </label>
                   <input
                     type="text"
                     name="departement"
                     value={formData.departement}
                     onChange={handleInputChange}
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                     Leave Balance (days)
                   </label>
                   <input
                     type="number"
                     name="leave_balance"
                     min="0"
                     value={formData.leave_balance}
                     onChange={handleInputChange}
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                     Satisfaction Rate (1-10)
                   </label>
                   <input
                     type="range"
                     name="satisfaction_rate"
                     min="1"
                     max="10"
                     value={formData.satisfaction_rate}
                     onChange={handleInputChange}
                     className="mt-1 block w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                   />
                   <span className="text-sm text-gray-500 dark:text-gray-400">
                     Current: {formData.satisfaction_rate}
                   </span>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                     Hire Date
                   </label>
                   <input
                     type="date"
                     name="hire_date"
                     value={formData.hire_date}
                     onChange={handleInputChange}
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                     Monthly Salary
                   </label>
                   <input
                     type="number"
                     name="monthly_salary"
                     step="0.01"
                     value={formData.monthly_salary}
                     onChange={handleInputChange}
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                   />
                 </div>
                  <div className="sm:col-span-2">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                       Weekly Work Hours
                     </label>
                     <input
                       type="number"
                       name="weekly_work_hours"
                       step="0.1"
                       value={formData.weekly_work_hours}
                       onChange={handleInputChange}
                       className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                     />
                 </div>
                  <div className="sm:col-span-2">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                     Notes
                   </label>
                   <textarea
                     name="notes"
                     value={formData.notes}
                     onChange={handleInputChange}
                     rows="3"
                     className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                   ></textarea>
                 </div>
               </div>

               <div className="flex justify-end space-x-3 pt-4">
                 <button
                   type="button"
                   onClick={onClose}
                   className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                 >
                   Cancel
                 </button>
                 <button
                   type="submit"
                   disabled={loading}
                   className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
                 >
                   {loading ? 'Updating...' : 'Update Employee'}
                 </button>
               </div>
            </form>
          </div>

          <div className="flex-1 md:pl-6 md:border-l md:border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Profile Picture
            </h3>
            <div className="space-y-4">
               <div className="mb-4">
                 <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Picture:</p>
                 <img
                   src={avatarFile ? URL.createObjectURL(avatarFile) : formData.avatar_url || '/path/to/default/avatar.png'}
                   alt="Current Avatar"
                   className="w-32 h-32 object-cover rounded-lg mb-2 bg-gray-200 dark:bg-gray-600"
                   onError={(e) => { e.target.src = '/path/to/default/avatar.png'; }}
                 />
                 <p className="text-xs text-gray-500 dark:text-gray-400">Upload a new file or use webcam to change the picture.</p>
               </div>

              {!isUsingWebcam ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                       Upload New Picture
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="block w-full text-sm text-gray-500 dark:text-gray-300
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/20 dark:file:text-blue-200
                        hover:file:bg-blue-100"
                      />
                   </div>
                   <button
                     type="button"
                     onClick={() => setIsUsingWebcam(true)}
                     className="w-full px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600"
                   >
                     Use Webcam Instead
                   </button>

                 </div>
               ) : (
                 <div className="space-y-4">
                   <Webcam
                     audio={false}
                     ref={webcamRef}
                     screenshotFormat="image/png"
                     className="w-full rounded-lg border dark:border-gray-600"
                   />
                   <div className="flex space-x-4">
                     <button
                       type="button"
                       onClick={handleCaptureWebcam}
                       className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                     >
                       Capture Photo
                     </button>
                     <button
                       type="button"
                       onClick={() => setIsUsingWebcam(false)}
                       className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                     >
                       Cancel Webcam
                     </button>
                   </div>
                 </div>
               )}
             </div>
           </div>
         </div>
       </div>
     </div>
   );
 };

 export default EditEmployeeModal; 