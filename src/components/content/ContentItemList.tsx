
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, FileText, Globe, Clock } from 'lucide-react';
import { ContentItem } from '@/services/cmsService';
import { sanitizeHtml } from '@/utils/sanitize';

interface ContentItemListProps {
  content: ContentItem[];
  isLoading: boolean;
  onEdit: (item: ContentItem) => void;
  onAddNew: () => void;
}

const ContentItemList: React.FC<ContentItemListProps> = ({
  content,
  isLoading,
  onEdit,
  onAddNew
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <Globe className="h-4 w-4 text-green-600" />;
      case 'draft':
        return <Edit className="h-4 w-4 text-yellow-600" />;
      case 'archived':
        return <Clock className="h-4 w-4 text-gray-600" />;
      default:
        return <FileText className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      published: 'default',
      draft: 'secondary',
      archived: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <p className="text-muted-foreground">Loading content...</p>
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
        <FileText className="h-10 w-10 mb-2" />
        <p>No content items found</p>
        <Button onClick={onAddNew} variant="outline" className="mt-4">
          Add Content
        </Button>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <div className="space-y-4">
        {content.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{item.title}</h4>
                    {getStatusBadge(item.status)}
                    {getStatusIcon(item.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Last updated: {new Date(item.updated_at).toLocaleDateString()}
                  </p>
                  {item.content && (
                    <div 
                      className="mt-2 text-sm prose prose-sm max-w-none line-clamp-2"
                      dangerouslySetInnerHTML={{ 
                        __html: sanitizeHtml(
                          item.content.length > 150 
                            ? item.content.substring(0, 150) + '...' 
                            : item.content
                        )
                      }}
                    />
                  )}
                  {item.metadata?.description && (
                    <p className="text-xs text-muted-foreground">
                      {item.metadata.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </ScrollArea>
  );
};

export default ContentItemList;
