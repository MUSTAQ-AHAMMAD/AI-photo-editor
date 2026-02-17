import React from 'react';

interface ImagePreviewProps {
  originalImage?: string;
  processedImage?: string;
  isProcessing?: boolean;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  originalImage,
  processedImage,
  isProcessing = false,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Original Image */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">Original</h3>
        <div className="border rounded-lg overflow-hidden bg-gray-100 aspect-video flex items-center justify-center">
          {originalImage ? (
            <img
              src={originalImage}
              alt="Original"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <p className="text-gray-400">No image uploaded</p>
          )}
        </div>
      </div>

      {/* Processed Image */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-gray-700">Processed</h3>
        <div className="border rounded-lg overflow-hidden bg-gray-100 aspect-video flex items-center justify-center">
          {isProcessing ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <p className="text-gray-600">Processing...</p>
            </div>
          ) : processedImage ? (
            <img
              src={processedImage}
              alt="Processed"
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <p className="text-gray-400">Processed image will appear here</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImagePreview;
