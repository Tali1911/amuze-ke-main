
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, X, Image } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
  poster?: string;
}

interface AnnouncementFormProps {
  title: string;
  content: string;
  date: string;
  priority: 'low' | 'medium' | 'high';
  previewUrl?: string;
  error: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onPriorityChange: (value: 'low' | 'medium' | 'high') => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemovePoster: () => void;
  onOpenMediaLibrary: () => void;
}

export const AnnouncementForm: React.FC<AnnouncementFormProps> = ({
  title,
  content,
  date,
  priority,
  previewUrl,
  error,
  onTitleChange,
  onContentChange,
  onDateChange,
  onPriorityChange,
  onFileChange,
  onRemovePoster,
  onOpenMediaLibrary
}) => {
  return (
    <div className="grid gap-4 py-4">
      {error && (
        <div className="px-3 py-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="title" className="text-right">
          Title
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="col-span-3"
          placeholder="Announcement title"
        />
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="date" className="text-right">
          Date
        </Label>
        <Input
          id="date"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
          className="col-span-3"
        />
      </div>
      
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="priority" className="text-right">
          Priority
        </Label>
        <Select 
          value={priority} 
          onValueChange={(value: 'low' | 'medium' | 'high') => onPriorityChange(value)}
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="content" className="text-right pt-2">
          Content
        </Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="col-span-3"
          rows={5}
          placeholder="Announcement details"
        />
      </div>
      
      <div className="grid grid-cols-4 items-start gap-4">
        <Label htmlFor="poster" className="text-right pt-2">
          Poster Image
        </Label>
        <div className="col-span-3">
          {previewUrl ? (
            <div className="relative mb-4">
              <img 
                src={previewUrl} 
                alt="Poster preview" 
                className="w-full max-h-48 object-contain rounded-md border"
              />
              <Button 
                variant="destructive" 
                size="icon" 
                className="absolute top-2 right-2 h-8 w-8"
                onClick={onRemovePoster}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label 
                  htmlFor="poster-upload" 
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">JPG, PNG, GIF, WebP (HEIC not supported)</p>
                  </div>
                  <Input 
                    id="poster-upload" 
                    type="file" 
                    className="hidden" 
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={onFileChange}
                  />
                </label>
              </div>
              
              <div className="flex justify-center">
                <span className="text-sm text-gray-500">or</span>
              </div>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onOpenMediaLibrary}
              >
                <Image className="mr-2 h-4 w-4" />
                Choose from Media Library
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
