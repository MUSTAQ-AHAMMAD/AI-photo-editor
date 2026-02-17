import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImageSelect, disabled = false }) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onImageSelect(acceptedFiles[0]);
      }
    },
    [onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    multiple: false,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-colors duration-200
        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center space-y-4">
        <svg
          className="w-16 h-16 text-gray-400"
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
        {isDragActive ? (
          <p className="text-blue-600 font-medium">Drop the image here...</p>
        ) : (
          <div>
            <p className="text-gray-700 font-medium">
              Drag & drop an image here, or click to select
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Supports: PNG, JPG, JPEG, WebP
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
