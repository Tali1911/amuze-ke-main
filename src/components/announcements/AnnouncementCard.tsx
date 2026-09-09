
import React from 'react';
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
  poster?: string;
}

interface AnnouncementCardProps {
  announcement: Announcement;
  onEdit: (announcement: Announcement) => void;
  onDelete: (id: string, title: string) => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ 
  announcement, 
  onEdit, 
  onDelete 
}) => {
  return (
    <Card key={announcement.id}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{announcement.title}</CardTitle>
            <CardDescription>{announcement.date}</CardDescription>
          </div>
          <div className={`px-2 py-1 rounded text-xs font-medium ${
            announcement.priority === 'high' ? 'bg-red-100 text-red-800' :
            announcement.priority === 'medium' ? 'bg-amber-100 text-amber-800' :
            'bg-green-100 text-green-800'
          }`}>
            {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        {announcement.poster && (
          <div className="mb-3 relative rounded-md overflow-hidden h-40">
            <img 
              src={announcement.poster} 
              alt={announcement.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'https://source.unsplash.com/photo-1500673922987-e212871fec22';
              }}
            />
          </div>
        )}
        <p className="text-sm text-gray-600 line-clamp-3">{announcement.content}</p>
      </CardContent>
      <CardFooter className="pt-0 flex justify-end gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onEdit(announcement)}
        >
          <Edit className="h-4 w-4 mr-1" /> Edit
        </Button>
        <Button 
          variant="destructive" 
          size="sm" 
          onClick={() => onDelete(announcement.id, announcement.title)}
        >
          <Trash2 className="h-4 w-4 mr-1" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
};
