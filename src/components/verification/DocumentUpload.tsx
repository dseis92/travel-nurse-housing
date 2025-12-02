import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../../lib/supabaseClient';
import { useAuthStore } from '../../stores/authStore';
import toast from 'react-hot-toast';

interface DocumentUploadProps {
  documentType: 'nursing_license' | 'government_id' | 'hospital_badge' | 'property_deed' | 'other';
  onUploadSuccess?: (fileUrl: string) => void;
}

export function DocumentUpload({ documentType, onUploadSuccess }: DocumentUploadProps) {
  const { user } = useAuthStore();
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!user) {
        toast.error('You must be signed in to upload documents');
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        toast.error('Only PNG, JPG, and PDF files are allowed');
        return;
      }

      setUploading(true);

      try {
        // Upload to storage
        const fileName = `${user.id}/${documentType}_${Date.now()}.${file.name.split('.').pop()}`;
        const { error: uploadError } = await supabase.storage
          .from('verification-docs')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get file URL (private, requires auth)
        const { data: urlData } = supabase.storage
          .from('verification-docs')
          .getPublicUrl(fileName);

        // Create verification document record
        const { error: dbError } = await supabase.from('verification_documents').insert({
          user_id: user.id,
          document_type: documentType,
          file_url: urlData.publicUrl,
          status: 'pending',
        });

        if (dbError) throw dbError;

        setUploadedFile(urlData.publicUrl);
        toast.success('Document uploaded successfully!');
        onUploadSuccess?.(urlData.publicUrl);
      } catch (error: any) {
        console.error('Upload error:', error);
        toast.error(error.message || 'Failed to upload document');
      } finally {
        setUploading(false);
      }
    },
    [user, documentType, onUploadSuccess]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
    disabled: uploading || !!uploadedFile,
  });

  return (
    <div className="w-full">
      {!uploadedFile ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          } ${uploading || uploadedFile ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center gap-3">
            {uploading ? (
              <>
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-600">Uploading...</p>
              </>
            ) : (
              <>
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div>
                  <p className="text-gray-700 font-medium">
                    {isDragActive ? 'Drop file here' : 'Drag & drop or click to upload'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">PNG, JPG, or PDF (max 10MB)</p>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-medium text-green-900">Document uploaded successfully</p>
              <p className="text-sm text-green-700">Your document is pending review</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
