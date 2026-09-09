
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Upload, Image as ImageIcon, Trash2, FileText } from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface MediaItem {
  id: string;
  url: string;
  alt: string;
  section: string;
  uploadedAt: string;
  type: 'image' | 'pdf';
  filename?: string; // For PDFs to track the original filename
}

interface AdminImageManagerProps {
  currentAdminUsername: string;
}

const initialSections = [
  { id: 'hero', name: 'Hero Section' },
  { id: 'about', name: 'About Us' },
  { id: 'team', name: 'Team Members' },
  { id: 'programs', name: 'Programs' },
  { id: 'gallery', name: 'Gallery' },
  { id: 'announcements', name: 'Announcements' },
  { id: 'documents', name: 'Documents' },
];

const AdminImageManager: React.FC<AdminImageManagerProps> = ({ currentAdminUsername }) => {
  const [media, setMedia] = useLocalStorage<MediaItem[]>('site-images', []);
  const [selectedSection, setSelectedSection] = useState<string>('all');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mediaAlt, setMediaAlt] = useState<string>('');
  const [mediaSection, setMediaSection] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadType, setUploadType] = useState<'image' | 'pdf'>('image');

  const filteredMedia = selectedSection === 'all' 
    ? media 
    : media.filter(item => item.section === selectedSection);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Set upload type based on file type
      if (file.type.startsWith('image/')) {
        setUploadType('image');
      } else if (file.type === 'application/pdf') {
        setUploadType('pdf');
        // Use filename as default alt text for PDFs
        if (!mediaAlt) {
          setMediaAlt(file.name.replace(/\.[^/.]+$/, "")); // Remove extension
        }
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !mediaSection) {
      toast({
        title: "Missing information",
        description: "Please select a file and section",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create object URL for images or data URL for PDFs
      let fileUrl;
      if (uploadType === 'image') {
        fileUrl = URL.createObjectURL(selectedFile);
      } else {
        // For PDFs, create a data URL
        fileUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
      }

      const newItem: MediaItem = {
        id: `media_${Date.now()}`,
        url: fileUrl,
        alt: mediaAlt || selectedFile.name,
        section: mediaSection,
        uploadedAt: new Date().toISOString(),
        type: uploadType,
        filename: selectedFile.name,
      };

      setMedia([...media, newItem]);
      setSelectedFile(null);
      setMediaAlt('');
      setMediaSection('');
      setUploadType('image');
      
      toast({
        title: `${uploadType === 'image' ? 'Image' : 'PDF'} added`,
        description: `Your ${uploadType} has been added to the library`,
      });

      // Log the action for audit purposes
      console.log(`Admin ${currentAdminUsername} uploaded ${uploadType}: ${newItem.id}`);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading your file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      // Find the item to get its URL before removing
      const itemToDelete = media.find(item => item.id === id);
      
      // Filter out the deleted item
      setMedia(media.filter(item => item.id !== id));
      
      // If using real URLs from blob storage, clean up the URL
      if (itemToDelete?.url.startsWith('blob:')) {
        URL.revokeObjectURL(itemToDelete.url);
      }
      
      toast({
        title: `${itemToDelete?.type === 'image' ? 'Image' : 'PDF'} deleted`,
        description: "The item has been removed from the library",
      });

      // Log the action for audit purposes
      console.log(`Admin ${currentAdminUsername} deleted ${itemToDelete?.type}: ${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Media Management</CardTitle>
          <CardDescription>
            Upload and manage images and documents used across the website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file-upload">Select File</Label>
                  <Input 
                    id="file-upload" 
                    type="file" 
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf" 
                    onChange={handleFileChange}
                  />
                  <div className="text-xs text-muted-foreground">
                    Images: JPG, PNG, GIF, WebP (HEIC not supported) | Documents: PDF
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="media-alt">Description</Label>
                  <Input
                    id="media-alt"
                    placeholder="Describe the file"
                    value={mediaAlt}
                    onChange={(e) => setMediaAlt(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="media-section">Section</Label>
                  <select
                    id="media-section"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={mediaSection}
                    onChange={(e) => setMediaSection(e.target.value)}
                  >
                    <option value="">Select a section</option>
                    {initialSections.map((section) => (
                      <option key={section.id} value={section.id}>{section.name}</option>
                    ))}
                  </select>
                </div>
                <Button 
                  onClick={handleUpload} 
                  disabled={isUploading || !selectedFile}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? "Uploading..." : `Upload ${uploadType === 'image' ? 'Image' : 'PDF'}`}
                </Button>
              </div>
              
              <div className="border rounded-md p-4">
                {selectedFile ? (
                  <div className="aspect-square flex items-center justify-center overflow-hidden rounded-md bg-muted">
                    {uploadType === 'image' ? (
                      <img 
                        src={URL.createObjectURL(selectedFile)} 
                        alt="Preview" 
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <FileText className="h-16 w-16 text-forest-600 mb-2" />
                        <span className="font-medium text-forest-700">{selectedFile.name}</span>
                        <span className="text-sm text-muted-foreground mt-1">
                          {(selectedFile.size / 1024).toFixed(0)} KB
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-square flex flex-col items-center justify-center rounded-md border border-dashed text-muted-foreground">
                    <ImageIcon className="h-10 w-10 mb-2" />
                    <span className="text-sm">File preview will appear here</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="space-y-0 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle>Media Library</CardTitle>
            <select
              className="w-40 rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              <option value="all">All Sections</option>
              {initialSections.map((section) => (
                <option key={section.id} value={section.id}>{section.name}</option>
              ))}
            </select>
          </div>
          <CardDescription>
            {filteredMedia.length} items in library
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {filteredMedia.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                <ImageIcon className="h-10 w-10 mb-2" />
                <p>No files found in this section</p>
                <p className="text-sm">Upload files to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filteredMedia.map((item) => (
                  <div key={item.id} className="group relative">
                    <div className="aspect-square overflow-hidden rounded-md border bg-muted">
                      {item.type === 'image' ? (
                        <img 
                          src={item.url} 
                          alt={item.alt}
                          className="h-full w-full object-cover transition-all hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full flex flex-col items-center justify-center p-3">
                          <FileText className="h-12 w-12 text-forest-600 mb-2" />
                          <span className="text-xs text-center font-medium truncate max-w-full">
                            {item.filename || 'PDF Document'}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleDelete(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-1 text-xs truncate">{item.alt}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {initialSections.find(s => s.id === item.section)?.name || item.section}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminImageManager;
