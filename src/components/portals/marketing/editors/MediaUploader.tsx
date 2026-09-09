import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Image, Video, X, Loader2, FolderOpen } from 'lucide-react';
import MediaLibrary from '../MediaLibrary';

interface MediaUploaderProps {
  mediaType: 'photo' | 'video';
  mediaUrl: string;
  thumbnailUrl?: string;
  onMediaTypeChange: (type: 'photo' | 'video') => void;
  onMediaUrlChange: (url: string) => void;
  onThumbnailUrlChange?: (url: string) => void;
  storagePath?: string;
}

const MediaUploader: React.FC<MediaUploaderProps> = ({
  mediaType,
  mediaUrl,
  thumbnailUrl,
  onMediaTypeChange,
  onMediaUrlChange,
  onThumbnailUrlChange,
  storagePath = 'page-media',
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingThumbnail, setIsUploadingThumbnail] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryMode, setLibraryMode] = useState<'media' | 'thumbnail'>('media');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const imageAccept = 'image/jpeg,image/jpg,image/png,image/gif,image/webp';
  const videoAccept = 'video/mp4,video/webm,video/quicktime';

  const handleFileUpload = async (file: File, isThumbnail = false) => {
    const fileName = file.name.toLowerCase();
    
    // Check for HEIC/HEIF files
    if (fileName.endsWith('.heic') || fileName.endsWith('.heif')) {
      toast.error('HEIC format not supported. Please convert to JPG or PNG first.');
      return;
    }

    // Validate file type based on media type
    if (!isThumbnail && mediaType === 'photo' && !file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (!isThumbnail && mediaType === 'video' && !file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }

    if (isThumbnail && !file.type.startsWith('image/')) {
      toast.error('Thumbnail must be an image file');
      return;
    }

    // Validate file size - 250MB for videos, 25MB for images
    const maxSize = mediaType === 'video' && !isThumbnail ? 250 * 1024 * 1024 : 25 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
      return;
    }

    if (isThumbnail) {
      setIsUploadingThumbnail(true);
    } else {
      setIsUploading(true);
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const folder = isThumbnail ? 'thumbnails' : (mediaType === 'video' ? 'videos' : 'images');
      const filePath = `${folder}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('page-media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('page-media')
        .getPublicUrl(filePath);

      if (isThumbnail) {
        onThumbnailUrlChange?.(publicUrl);
        toast.success('Thumbnail uploaded successfully');
      } else {
        onMediaUrlChange(publicUrl);
        toast.success(`${mediaType === 'video' ? 'Video' : 'Image'} uploaded successfully`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      if (isThumbnail) {
        setIsUploadingThumbnail(false);
      } else {
        setIsUploading(false);
      }
    }
  };

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file, false);
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file, true);
  };

  const clearMedia = () => {
    onMediaUrlChange('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const clearThumbnail = () => {
    onThumbnailUrlChange?.('');
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = '';
  };

  const handleLibrarySelect = (url: string, type: 'photo' | 'video') => {
    if (libraryMode === 'thumbnail') {
      onThumbnailUrlChange?.(url);
      toast.success('Thumbnail selected from library');
    } else {
      if (type !== mediaType) {
        onMediaTypeChange(type);
      }
      onMediaUrlChange(url);
      toast.success(`${type === 'video' ? 'Video' : 'Image'} selected from library`);
    }
    setShowLibrary(false);
  };

  const openLibraryForMedia = () => {
    setLibraryMode('media');
    setShowLibrary(true);
  };

  const openLibraryForThumbnail = () => {
    setLibraryMode('thumbnail');
    setShowLibrary(true);
  };

  return (
    <div className="space-y-4">
      {/* Media Type Toggle */}
      <div>
        <Label className="text-base font-medium mb-3 block">Media Type</Label>
        <RadioGroup
          value={mediaType}
          onValueChange={(value) => onMediaTypeChange(value as 'photo' | 'video')}
          className="flex gap-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="photo" id="photo" />
            <Label htmlFor="photo" className="flex items-center gap-2 cursor-pointer">
              <Image className="w-4 h-4" />
              Photo
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="video" id="video" />
            <Label htmlFor="video" className="flex items-center gap-2 cursor-pointer">
              <Video className="w-4 h-4" />
              Video
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Media Upload */}
      <div>
        <Label className="text-sm font-medium mb-2 block">
          {mediaType === 'video' ? 'Video File' : 'Image File'}
        </Label>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={mediaUrl}
              onChange={(e) => onMediaUrlChange(e.target.value)}
              placeholder={mediaType === 'video' ? 'https://... or upload video' : 'https://... or upload image'}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={openLibraryForMedia}
              title="Browse Library"
            >
              <FolderOpen className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              title="Upload New"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </Button>
            {mediaUrl && (
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={clearMedia}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={mediaType === 'video' ? videoAccept : imageAccept}
              className="hidden"
              onChange={handleMediaFileChange}
            />
          </div>

          {/* Preview */}
          {mediaUrl && (
            <div className="relative w-full h-40 rounded-md overflow-hidden border bg-muted">
              {mediaType === 'video' ? (
                <video
                  src={mediaUrl}
                  className="w-full h-full object-cover"
                  controls
                  muted
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {mediaType === 'video' 
              ? 'Supported: MP4, WebM (max 250MB)' 
              : 'Supported: JPG, PNG, WebP, GIF (max 25MB)'}
          </p>
        </div>
      </div>

      {/* Video Thumbnail (only for videos) */}
      {mediaType === 'video' && (
        <div>
          <Label className="text-sm font-medium mb-2 block">Video Thumbnail (optional)</Label>
          <div className="space-y-3">
          <div className="flex gap-2">
              <Input
                value={thumbnailUrl || ''}
                onChange={(e) => onThumbnailUrlChange?.(e.target.value)}
                placeholder="Thumbnail image URL or upload"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={openLibraryForThumbnail}
                title="Browse Library"
              >
                <FolderOpen className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => thumbnailInputRef.current?.click()}
                disabled={isUploadingThumbnail}
                title="Upload New"
              >
                {isUploadingThumbnail ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
              </Button>
              {thumbnailUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={clearThumbnail}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
              <input
                ref={thumbnailInputRef}
                type="file"
                accept={imageAccept}
                className="hidden"
                onChange={handleThumbnailFileChange}
              />
            </div>

            {thumbnailUrl && (
              <div className="relative w-32 h-20 rounded-md overflow-hidden border">
                <img
                  src={thumbnailUrl}
                  alt="Thumbnail preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Shown while video loads. Recommended: 16:9 aspect ratio
            </p>
          </div>
        </div>
      )}

      {/* Media Library Dialog */}
      <MediaLibrary
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onSelect={handleLibrarySelect}
        filterType={libraryMode === 'thumbnail' ? 'image' : 'all'}
      />
    </div>
  );
};

export default MediaUploader;
