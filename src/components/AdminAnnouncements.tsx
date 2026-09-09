
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlusCircle } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { 
  getAnnouncements, 
  saveAnnouncement, 
  deleteAnnouncement, 
  saveToLocalStorage 
} from "@/services/dataService";
import { format } from 'date-fns';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { AnnouncementCard } from './announcements/AnnouncementCard';
import { AnnouncementForm } from './announcements/AnnouncementForm';
import { MediaLibrary } from './announcements/MediaLibrary';

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
  poster?: string;
}

interface MediaItem {
  id: string;
  url: string;
  alt: string;
  section: string;
  uploadedAt: string;
  type: 'image' | 'pdf';
  filename?: string;
}

interface AdminAnnouncementsProps {
  currentAdminUsername: string;
}

const AdminAnnouncements: React.FC<AdminAnnouncementsProps> = ({ 
  currentAdminUsername 
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>(getAnnouncements());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentAnnouncementId, setCurrentAnnouncementId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [poster, setPoster] = useState<string | undefined>(undefined);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(undefined);
  const [error, setError] = useState('');
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [galleryImages, setGalleryImages] = useLocalStorage<MediaItem[]>('site-images', []);
  const [filteredImages, setFilteredImages] = useState<MediaItem[]>([]);

  useEffect(() => {
    // Filter images from the Announcements section
    setFilteredImages(galleryImages.filter(img => 
      img.section === 'announcements' && img.type === 'image'
    ));
  }, [galleryImages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPosterFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePoster = () => {
    setPosterFile(null);
    setPreviewUrl(undefined);
    setPoster(undefined);
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setPriority('medium');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setPoster(undefined);
    setPosterFile(null);
    setPreviewUrl(undefined);
    setError('');
    setIsEditing(false);
    setCurrentAnnouncementId(null);
  };

  const handleNewAnnouncement = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEditAnnouncement = (announcement: Announcement) => {
    setTitle(announcement.title);
    setContent(announcement.content);
    setPriority(announcement.priority);
    setDate(announcement.date);
    setPoster(announcement.poster);
    setPreviewUrl(announcement.poster);
    setIsEditing(true);
    setCurrentAnnouncementId(announcement.id);
    setIsDialogOpen(true);
  };

  const validateForm = () => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!content.trim()) {
      setError('Content is required');
      return false;
    }
    if (!date) {
      setError('Date is required');
      return false;
    }
    return true;
  };

  const handleSelectLibraryImage = (imageUrl: string) => {
    setPreviewUrl(imageUrl);
    setPoster(imageUrl);
    setPosterFile(null);
    setIsLibraryOpen(false);
  };

  const handleSaveImageToLibrary = () => {
    if (posterFile && previewUrl) {
      // Add the new image to the gallery
      const newImage: MediaItem = {
        id: `ann_img_${Date.now()}`,
        url: previewUrl,
        alt: title || 'Announcement image',
        section: 'announcements',
        uploadedAt: new Date().toISOString(),
        type: 'image',
      };

      setGalleryImages([...galleryImages, newImage]);
      saveToLocalStorage();
      
      toast({
        title: "Image saved",
        description: "Image has been added to your media library",
        duration: 3000,
      });
    }
  };

  const handleSaveAnnouncement = async () => {
    if (!validateForm()) return;

    try {
      let posterUrl = poster;

      // Convert the poster file to base64 for storage (in a real app, this would upload to a server)
      if (posterFile) {
        // For our demo, we're storing the data URL directly
        // In a production app, this would be a URL after uploading to a server
        posterUrl = previewUrl;
        
        // Save the image to the library for reuse
        handleSaveImageToLibrary();
      }

      const announcementData: Partial<Announcement> = {
        title,
        content,
        date,
        priority,
        poster: posterUrl
      };

      if (isEditing && currentAnnouncementId) {
        announcementData.id = currentAnnouncementId;
      }

      const savedAnnouncement = saveAnnouncement(announcementData, currentAdminUsername);
      
      setAnnouncements(getAnnouncements());
      saveToLocalStorage();
      
      toast({
        title: "Success",
        description: `Announcement ${isEditing ? "updated" : "created"} successfully.`,
        duration: 3000,
      });

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving announcement:', error);
      setError('Failed to save announcement');
    }
  };

  const handleDeleteAnnouncement = (id: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete the announcement: "${title}"?`)) {
      try {
        const success = deleteAnnouncement(id, currentAdminUsername);
        
        if (success) {
          setAnnouncements(getAnnouncements());
          saveToLocalStorage();
          
          toast({
            title: "Success",
            description: `Announcement deleted successfully.`,
            duration: 3000,
          });
        }
      } catch (error) {
        console.error('Error deleting announcement:', error);
        toast({
          title: "Error",
          description: "Failed to delete announcement.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Announcements Management</h2>
        <Button onClick={handleNewAnnouncement}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Announcement
        </Button>
      </div>

      {/* Announcements List */}
      <ScrollArea className="h-[600px] rounded-md border">
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {announcements.length === 0 ? (
            <div className="col-span-full text-center py-10">
              <p className="text-gray-500">No announcements yet. Create your first one!</p>
            </div>
          ) : (
            announcements.map(announcement => (
              <AnnouncementCard 
                key={announcement.id}
                announcement={announcement}
                onEdit={handleEditAnnouncement}
                onDelete={handleDeleteAnnouncement}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Announcement Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Announcement' : 'New Announcement'}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Make changes to this announcement' 
                : 'Create a new announcement to share with visitors'}
            </DialogDescription>
          </DialogHeader>
          
          <AnnouncementForm 
            title={title}
            content={content}
            date={date}
            priority={priority}
            previewUrl={previewUrl}
            error={error}
            onTitleChange={setTitle}
            onContentChange={setContent}
            onDateChange={setDate}
            onPriorityChange={setPriority}
            onFileChange={handleFileChange}
            onRemovePoster={handleRemovePoster}
            onOpenMediaLibrary={() => setIsLibraryOpen(true)}
          />
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAnnouncement}>
              {isEditing ? 'Update Announcement' : 'Create Announcement'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Media Library Dialog */}
      <MediaLibrary 
        isOpen={isLibraryOpen}
        onOpenChange={setIsLibraryOpen}
        filteredImages={filteredImages}
        onSelectImage={handleSelectLibraryImage}
      />
    </div>
  );
};

export default AdminAnnouncements;
