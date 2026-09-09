import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Image, Video, Search, Loader2, Trash2, Check, FolderOpen } from 'lucide-react';

interface MediaItem {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  size: number;
  created_at: string;
  folder: string;
}

interface MediaLibraryProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSelect?: (url: string, type: 'photo' | 'video') => void;
  filterType?: 'all' | 'image' | 'video';
  embedded?: boolean;
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({
  isOpen = true,
  onClose,
  onSelect,
  filterType = 'all',
  embedded = false,
}) => {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'images' | 'videos'>('all');
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen || embedded) {
      loadMedia();
    }
  }, [isOpen, embedded]);

  const loadMedia = async () => {
    setIsLoading(true);
    try {
      // Load from images folder
      const { data: imagesData, error: imagesError } = await supabase.storage
        .from('page-media')
        .list('images', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

      // Load from videos folder
      const { data: videosData, error: videosError } = await supabase.storage
        .from('page-media')
        .list('videos', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

      // Load from thumbnails folder
      const { data: thumbnailsData, error: thumbnailsError } = await supabase.storage
        .from('page-media')
        .list('thumbnails', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });

      if (imagesError) console.error('Error loading images:', imagesError);
      if (videosError) console.error('Error loading videos:', videosError);
      if (thumbnailsError) console.error('Error loading thumbnails:', thumbnailsError);

      const items: MediaItem[] = [];

      // Process images
      (imagesData || []).forEach(file => {
        if (file.name && !file.name.startsWith('.')) {
          const { data: { publicUrl } } = supabase.storage
            .from('page-media')
            .getPublicUrl(`images/${file.name}`);
          items.push({
            id: file.id || file.name,
            name: file.name,
            url: publicUrl,
            type: 'image',
            size: file.metadata?.size || 0,
            created_at: file.created_at || '',
            folder: 'images',
          });
        }
      });

      // Process videos
      (videosData || []).forEach(file => {
        if (file.name && !file.name.startsWith('.')) {
          const { data: { publicUrl } } = supabase.storage
            .from('page-media')
            .getPublicUrl(`videos/${file.name}`);
          items.push({
            id: file.id || file.name,
            name: file.name,
            url: publicUrl,
            type: 'video',
            size: file.metadata?.size || 0,
            created_at: file.created_at || '',
            folder: 'videos',
          });
        }
      });

      // Process thumbnails (as images)
      (thumbnailsData || []).forEach(file => {
        if (file.name && !file.name.startsWith('.')) {
          const { data: { publicUrl } } = supabase.storage
            .from('page-media')
            .getPublicUrl(`thumbnails/${file.name}`);
          items.push({
            id: file.id || file.name,
            name: file.name,
            url: publicUrl,
            type: 'image',
            size: file.metadata?.size || 0,
            created_at: file.created_at || '',
            folder: 'thumbnails',
          });
        }
      });

      setMediaItems(items);
    } catch (error) {
      console.error('Error loading media:', error);
      toast.error('Failed to load media library');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;

    setIsDeleting(item.id);
    try {
      const { error } = await supabase.storage
        .from('page-media')
        .remove([`${item.folder}/${item.name}`]);

      if (error) throw error;

      setMediaItems(prev => prev.filter(m => m.id !== item.id));
      toast.success('File deleted');
      if (selectedItem?.id === item.id) setSelectedItem(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSelect = () => {
    if (selectedItem && onSelect) {
      onSelect(selectedItem.url, selectedItem.type === 'image' ? 'photo' : 'video');
      onClose?.();
      setSelectedItem(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'Unknown size';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredItems = mediaItems.filter(item => {
    // Apply type filter
    if (filterType === 'image' && item.type !== 'image') return false;
    if (filterType === 'video' && item.type !== 'video') return false;
    if (activeTab === 'images' && item.type !== 'image') return false;
    if (activeTab === 'videos' && item.type !== 'video') return false;

    // Apply search filter
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    return true;
  });

  const imageCount = mediaItems.filter(m => m.type === 'image').length;
  const videoCount = mediaItems.filter(m => m.type === 'video').length;

  const content = (
    <div className={`flex flex-col gap-4 ${embedded ? '' : 'flex-1 min-h-0 overflow-hidden'}`}>
      {/* Search and filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" onClick={loadMedia} disabled={isLoading}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>

      {/* Tabs */}
      {filterType === 'all' && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'images' | 'videos')}>
          <TabsList>
            <TabsTrigger value="all">All ({mediaItems.length})</TabsTrigger>
            <TabsTrigger value="images" className="flex items-center gap-1">
              <Image className="w-3 h-3" />
              Images ({imageCount})
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-1">
              <Video className="w-3 h-3" />
              Videos ({videoCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}

      {/* Media grid */}
      <ScrollArea className={embedded ? 'h-[500px]' : 'h-[400px]'}>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FolderOpen className="w-12 h-12 mb-2" />
            <p>No media found</p>
            <p className="text-sm">Upload files to see them here</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`
                  relative group rounded-lg overflow-hidden border-2 ${onSelect ? 'cursor-pointer' : ''} transition-all
                  ${selectedItem?.id === item.id 
                    ? 'border-primary ring-2 ring-primary/20' 
                    : 'border-border hover:border-primary/50'}
                `}
                onClick={() => onSelect && setSelectedItem(item)}
              >
                {/* Media preview */}
                <div className="aspect-video bg-muted relative">
                  {item.type === 'video' ? (
                    <>
                      <video
                        src={item.url}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Video className="w-8 h-8 text-white drop-shadow-lg" />
                      </div>
                    </>
                  ) : (
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}

                  {/* Selection indicator */}
                  {selectedItem?.id === item.id && onSelect && (
                    <div className="absolute top-2 right-2 bg-primary rounded-full p-1">
                      <Check className="w-4 h-4 text-primary-foreground" />
                    </div>
                  )}

                  {/* Delete button */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(item);
                    }}
                    disabled={isDeleting === item.id}
                  >
                    {isDeleting === item.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </Button>
                </div>

                {/* Info */}
                <div className="p-2 bg-background">
                  <p className="text-xs font-medium truncate" title={item.name}>
                    {item.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px] px-1 py-0">
                      {item.type === 'video' ? '🎬 Video' : '📷 Image'}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatFileSize(item.size)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer with selection info - only show when selecting */}
      {onSelect && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {selectedItem ? (
              <span>Selected: <strong>{selectedItem.name}</strong></span>
            ) : (
              <span>Click an item to select it</span>
            )}
          </div>
          <div className="flex gap-2">
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            )}
            <Button onClick={handleSelect} disabled={!selectedItem}>
              Use Selected
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // Embedded mode - render directly without dialog wrapper
  if (embedded) {
    return content;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5" />
            Media Library
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};

export default MediaLibrary;
