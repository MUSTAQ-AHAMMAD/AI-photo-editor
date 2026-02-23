import React, { useState } from 'react';

interface MultiFormatDownloadProps {
  imageUrl: string;
  baseFilename?: string;
  disabled?: boolean;
}

type Format = 'png' | 'jpeg' | 'webp';

const FORMAT_LABELS: Record<Format, string> = {
  png: 'PNG (Lossless)',
  jpeg: 'JPEG (Compressed)',
  webp: 'WebP (Modern)',
};

const MultiFormatDownload: React.FC<MultiFormatDownloadProps> = ({
  imageUrl,
  baseFilename = 'ai-generated',
  disabled = false,
}) => {
  const [converting, setConverting] = useState(false);

  const downloadAs = async (format: Format) => {
    if (disabled) return;
    setConverting(true);
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageUrl;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d')!;

      if (format === 'jpeg') {
        // Fill white background for JPEG (no transparency)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.drawImage(img, 0, 0);

      const mimeType = format === 'png' ? 'image/png' : format === 'jpeg' ? 'image/jpeg' : 'image/webp';
      const quality = format === 'jpeg' ? 0.92 : undefined;
      const dataUrl = canvas.toDataURL(mimeType, quality);

      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${baseFilename}.${format === 'jpeg' ? 'jpg' : format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-zinc-400 flex items-center gap-2 mb-2">
        <span>⬇</span> Download
      </p>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(FORMAT_LABELS) as Format[]).map((fmt) => (
          <button
            key={fmt}
            onClick={() => downloadAs(fmt)}
            disabled={disabled || converting}
            className="px-3 py-1.5 text-xs font-medium bg-white/[0.05] border border-white/10 text-zinc-300 hover:text-white hover:border-white/20 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {converting ? '…' : `.${fmt === 'jpeg' ? 'jpg' : fmt}`} — {FORMAT_LABELS[fmt].split(' ')[0]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MultiFormatDownload;
