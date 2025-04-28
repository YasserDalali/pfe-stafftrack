// Utility function to fetch employee data and images from Supabase
import sb from '../database/supabase-client';

// Updated to remove usage of the 'fs' module and use browser-compatible alternatives
export const fetchEmployeeData = async () => {
  try {
    console.log('Starting to fetch employee data and faces...');

    // Use a browser-compatible approach for storing images
    const imagesFolder = './src/assets/images';

    // List all files in the employee-avatars bucket
    const { data: files, error: storageError } = await sb.storage
      .from('employee-avatars')
      .list();

    if (storageError) {
      console.error('Error listing files:', storageError);
      throw storageError;
    }

    console.log('Found files in bucket:', files);

    // Fetch all employees with avatar URLs
    const { data: employees, error: dbError } = await sb
      .from('employees')
      .select('id, name, avatar_url')
      .not('avatar_url', 'is', null);

    if (dbError) {
      console.error('Error fetching employees:', dbError);
      throw dbError;
    }

    console.log('Found employees:', employees);

    const referenceImages = {};
    const processedEmployees = new Set();

    for (const employee of employees) {
      if (!employee.avatar_url || processedEmployees.has(employee.name)) continue;

      try {
        const { publicUrl } = sb.storage
          .from('employee-avatars')
          .getPublicUrl(employee.avatar_url);

        if (publicUrl) {
          // Store the image URL instead of downloading it locally
          referenceImages[employee.name] = [publicUrl];
          processedEmployees.add(employee.name);

          console.log(`Processed avatar for ${employee.name}:`, publicUrl);

          const employeeFiles = files.filter(
            (file) =>
              file.name.toLowerCase().includes(employee.name.toLowerCase()) &&
              file.name !== employee.avatar_url
          );

          for (const file of employeeFiles) {
            const { publicUrl: additionalImageUrl } = sb.storage
              .from('employee-avatars')
              .getPublicUrl(file.name);

            if (additionalImageUrl) {
              referenceImages[employee.name].push(additionalImageUrl);
              console.log(`Added additional training image for ${employee.name}:`, file.name);
            }
          }
        }
      } catch (error) {
        console.error(`Error processing employee ${employee.name}:`, error);
      }
    }

    console.log('Finished processing employee faces:', {
      employeeCount: Object.keys(referenceImages).length,
      totalImages: Object.values(referenceImages).flat().length,
    });

    return referenceImages;
  } catch (error) {
    console.error('Error fetching employee data:', error);
    return {};
  }
};