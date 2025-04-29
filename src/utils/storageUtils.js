import supabase from '../database/supabase-client';
import * as faceapi from 'face-api.js';

const BUCKET_NAME = 'employee-avatars';

export const downloadAndProcessImage = async (filePath) => {
  try {
    console.log('📥 Fetching public URL for image:', filePath);
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (error) {
      console.error('❌ Error getting public URL:', error);
      return null;
    }

    if (!data?.publicUrl) {
      console.error('❌ No public URL found for:', filePath);
      return null;
    }

    console.log('🔗 Public URL obtained:', data.publicUrl);

    // Load image from public URL
    console.log('🔄 Loading image from public URL');
    const img = await faceapi.fetchImage(data.publicUrl);
    console.log('✅ Image loaded successfully');
    
    return img;
  } catch (error) {
    console.error('❌ Error processing image:', error);
    return null;
  }
};

export const loadEmployeePhotos = async () => {
  try {
    console.log('📚 Loading employee photos from storage');
    
    // First check if bucket exists
    const { data: buckets, error: bucketError } = await supabase.storage
      .listBuckets();

    if (bucketError) {
      console.error('❌ Error listing buckets:', bucketError);
      return [];
    }

    const bucketExists = buckets.some(bucket => bucket.name === BUCKET_NAME);
    if (!bucketExists) {
      console.error(`❌ Bucket '${BUCKET_NAME}' not found. Available buckets:`, 
        buckets.map(b => b.name));
      return [];
    }

    console.log(`✅ Found bucket: ${BUCKET_NAME}`);

    // List files in bucket
    const { data: files, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list();

    if (error) {
      console.error('❌ Error listing files:', error);
      return [];
    }

    // Filter image files
    const imageFiles = files.filter(file => 
      file.name.toLowerCase().endsWith('.png') || 
      file.name.toLowerCase().endsWith('.jpg') ||
      file.name.toLowerCase().endsWith('.jpeg')
    );

    console.log('📸 Found image files:', imageFiles.map(f => f.name));

    // Get public URLs for all images
    const filesWithUrls = await Promise.all(
      imageFiles.map(async (file) => {
        const { data: urlData } = await supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(file.name);
        
        return {
          ...file,
          publicUrl: urlData?.publicUrl
        };
      })
    );

    console.log('🔗 Files with public URLs:', filesWithUrls.map(f => ({
      name: f.name,
      url: f.publicUrl
    })));

    return filesWithUrls;
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

export const getEmployeesWithAvatars = async () => {
  try {
    console.log('📚 Fetching employees with avatars');
    const { data: employees, error } = await supabase
      .from('employees')
      .select('*')
      .not('avatar_url', 'is', null);

    if (error) {
      console.error('❌ Error fetching employees:', error);
      return [];
    }

    console.log(`✅ Found ${employees.length} employees with avatars`);
    return employees;
  } catch (error) {
    console.error('❌ Error in getEmployeesWithAvatars:', error);
    return [];
  }
};

export const processEmployeeAvatar = async (employee) => {
  try {
    if (!employee.avatar_url) {
      console.log(`⚠️ No avatar URL for employee ${employee.name}`);
      return null;
    }

    console.log(`🔄 Processing avatar for ${employee.name}`);
    console.log(`🔗 Avatar URL: ${employee.avatar_url}`);

    // Load image from URL
    const img = await faceapi.fetchImage(employee.avatar_url);
    console.log(`✅ Avatar loaded for ${employee.name}`);

    return {
      employee,
      image: img
    };
  } catch (error) {
    console.error(`❌ Error processing avatar for ${employee.name}:`, error);
    return null;
  }
};

export const generateFaceDescriptor = async (file) => {
  try {
    // Convert file to image
    const imageUrl = URL.createObjectURL(file);
    const img = new window.Image();
    img.src = imageUrl;

    // Wait for the image to load
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    // Now pass the loaded image element to face-api.js
    const detection = await faceapi
      .detectSingleFace(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptor();

    URL.revokeObjectURL(imageUrl);

    if (!detection) {
      console.log(`⚠️ No face detected in avatar`);
      return null;
    }

    return detection.descriptor;
  } catch (error) {
    console.error('❌ Error generating face descriptor:', error);
    return null;
  }
};

export const buildEmployeeFaceDescriptors = async () => {
  try {
    // Get all employees with avatars
    const employees = await getEmployeesWithAvatars();
    console.log(`🔄 Processing ${employees.length} employees`);

    // Process each employee's avatar
    const processedAvatars = await Promise.all(
      employees.map(employee => processEmployeeAvatar(employee))
    );

    // Generate face descriptors
    const descriptors = await Promise.all(
      processedAvatars
        .filter(Boolean) // Remove null results
        .map(avatar => generateFaceDescriptor(avatar.image))
    );

    // Filter out failed detections and format results
    const validDescriptors = descriptors.filter(Boolean).reduce((acc, curr) => {
      acc[curr.employeeId] = {
        name: curr.name,
        descriptors: [curr]
      };
      return acc;
    }, {});

    console.log('📊 Final descriptor count:', Object.keys(validDescriptors).length);
    return validDescriptors;
  } catch (error) {
    console.error('❌ Error in buildEmployeeFaceDescriptors:', error);
    return {};
  }
}; 