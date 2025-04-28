import supabase from '../database/supabase-client';
import * as faceapi from 'face-api.js';

export const downloadAndProcessImage = async (filePath) => {
  try {
    console.log('📥 Downloading image:', filePath);
    const { data, error } = await supabase.storage
      .from('employee-photos')
      .download(filePath);

    if (error) {
      console.error('❌ Error downloading image:', error);
      return null;
    }

    console.log('✅ Image downloaded successfully:', filePath);
    
    // Convert blob to URL
    const imageUrl = URL.createObjectURL(data);
    console.log('🔄 Converting blob to image URL');
    const img = await faceapi.fetchImage(imageUrl);
    console.log('✅ Image converted successfully');
    
    // Clean up the URL after processing
    URL.revokeObjectURL(imageUrl);
    
    return img;
  } catch (error) {
    console.error('❌ Error processing image:', error);
    return null;
  }
};

export const loadEmployeePhotos = async () => {
  try {
    console.log('📚 Loading employee photos from storage');
    const { data: files, error } = await supabase.storage
      .from('employee-photos')
      .list();

    if (error) {
      console.error('❌ Error listing files:', error);
      return [];
    }

    const imageFiles = files.filter(file => 
      file.name.toLowerCase().endsWith('.png') || 
      file.name.toLowerCase().endsWith('.jpg') ||
      file.name.toLowerCase().endsWith('.jpeg')
    );

    console.log('📸 Found image files:', imageFiles.map(f => f.name));
    return imageFiles;
  } catch (error) {
    console.error('❌ Error loading employee photos:', error);
    return [];
  }
};

export const getEmployeeIdFromFilename = (filename) => {
  const employeeId = filename.split('_')[0];
  console.log('👤 Extracted employee ID:', employeeId, 'from filename:', filename);
  return employeeId;
}; 