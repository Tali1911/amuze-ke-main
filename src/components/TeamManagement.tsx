
import React, { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { PlusCircle, Pencil, Trash2, UserCircle, Upload } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  shortDescription?: string;
  image: string;
  specialization: string;
  icon: string;
}

interface TeamManagementProps {
  currentAdminUsername: string;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ currentAdminUsername }) => {
  const [teamMembers, setTeamMembers] = useLocalStorage<TeamMember[]>('team-members', []);
  const [siteImages] = useLocalStorage<any[]>('site-images', []);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<Partial<TeamMember> | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  
  const iconOptions = [
    { value: 'Trophy', label: 'Trophy' },
    { value: 'Heart', label: 'Heart' },
    { value: 'Briefcase', label: 'Briefcase' },
    { value: 'Leaf', label: 'Leaf' },
    { value: 'Users', label: 'Users' },
  ];

  const handleAddMember = () => {
    setCurrentMember({
      name: '',
      role: '',
      bio: '',
      shortDescription: '',
      image: '',
      specialization: '',
      icon: 'Trophy'
    });
    setSelectedImage('');
    setIsDialogOpen(true);
  };

  const handleEditMember = (member: TeamMember) => {
    setCurrentMember({ ...member });
    setSelectedImage(member.image);
    setIsDialogOpen(true);
  };

  const handleDeleteMember = (id: string) => {
    if (window.confirm('Are you sure you want to delete this team member?')) {
      setTeamMembers(teamMembers.filter(member => member.id !== id));
      
      toast({
        title: "Team Member Deleted",
        description: "The team member has been removed successfully.",
        duration: 3000,
      });
    }
  };

  const handleSaveMember = () => {
    if (!currentMember?.name || !currentMember?.role || !currentMember?.bio) {
      toast({
        title: "Missing Information",
        description: "Please fill out all required fields.",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    const memberToSave = {
      ...currentMember,
      id: currentMember.id || `${Date.now()}`,
      image: selectedImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d' // Default image
    } as TeamMember;

    if (currentMember.id) {
      // Update existing member
      setTeamMembers(teamMembers.map(member => 
        member.id === currentMember.id ? memberToSave : member
      ));
      
      toast({
        title: "Team Member Updated",
        description: `${memberToSave.name}'s information has been updated.`,
        duration: 3000,
      });
    } else {
      // Add new member
      setTeamMembers([...teamMembers, memberToSave]);
      
      toast({
        title: "Team Member Added",
        description: `${memberToSave.name} has been added to the team.`,
        duration: 3000,
      });
    }

    setIsDialogOpen(false);
  };

  const getTeamImages = () => {
    return siteImages.filter(img => img.section === 'team' || img.alt?.toLowerCase().includes('team') || img.alt?.toLowerCase().includes('profile') || img.alt?.toLowerCase().includes('person'));
  };

  const allImages = siteImages.map(img => ({ value: img.url, label: img.alt || img.url }));

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Team Members Management</h3>
        <Button onClick={handleAddMember}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </div>

      <ScrollArea className="h-[500px] rounded-md border">
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.length === 0 ? (
            <div className="col-span-full p-8 text-center text-muted-foreground">
              No team members found. Add your first team member!
            </div>
          ) : (
            teamMembers.map(member => (
              <Card key={member.id} className="overflow-hidden">
                <div className="aspect-square w-full overflow-hidden bg-gray-100">
                  {member.image ? (
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="h-full w-full object-cover" 
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-slate-100">
                      <UserCircle className="h-16 w-16 text-slate-300" />
                    </div>
                  )}
                </div>
                <CardHeader className="p-4">
                  <CardTitle className="text-lg">{member.name}</CardTitle>
                  <p className="text-sm text-forest-600">{member.role}</p>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-gray-600 line-clamp-3">{member.bio}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleEditMember(member)}
                  >
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleDeleteMember(member.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentMember?.id ? 'Edit Team Member' : 'Add New Team Member'}</DialogTitle>
            <DialogDescription>
              {currentMember?.id 
                ? 'Update the information for this team member' 
                : 'Enter the details for the new team member'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-4 mb-4">
              <Avatar className="h-24 w-24">
                {selectedImage ? (
                  <AvatarImage src={selectedImage} alt="Preview" className="object-cover" />
                ) : (
                  <AvatarFallback>
                    <UserCircle className="h-12 w-12" />
                  </AvatarFallback>
                )}
              </Avatar>
              
              <Select 
                value={selectedImage} 
                onValueChange={setSelectedImage}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an image" />
                </SelectTrigger>
                <SelectContent>
                  {allImages.map(img => (
                    <SelectItem key={img.value} value={img.value}>
                      <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full overflow-hidden bg-slate-100">
                          <img src={img.value} className="h-full w-full object-cover" />
                        </div>
                        <span className="truncate max-w-[200px]">{img.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={currentMember?.name || ''}
                onChange={(e) => setCurrentMember({ ...currentMember!, name: e.target.value })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="role" className="text-right">
                Role
              </Label>
              <Input
                id="role"
                value={currentMember?.role || ''}
                onChange={(e) => setCurrentMember({ ...currentMember!, role: e.target.value })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="specialization" className="text-right">
                Specialization
              </Label>
              <Input
                id="specialization"
                value={currentMember?.specialization || ''}
                onChange={(e) => setCurrentMember({ ...currentMember!, specialization: e.target.value })}
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="icon" className="text-right">
                Icon
              </Label>
              <Select 
                value={currentMember?.icon || 'Trophy'} 
                onValueChange={(value) => setCurrentMember({ ...currentMember!, icon: value })}
              >
                <SelectTrigger className="col-span-3 w-full">
                  <SelectValue placeholder="Select an icon" />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map(icon => (
                    <SelectItem key={icon.value} value={icon.value}>
                      {icon.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="shortDescription" className="text-right pt-2">
                Short Description
              </Label>
              <Textarea
                id="shortDescription"
                value={currentMember?.shortDescription || ''}
                onChange={(e) => setCurrentMember({ ...currentMember!, shortDescription: e.target.value })}
                className="col-span-3 min-h-[60px]"
                placeholder="Brief 2-line description for card view"
              />
            </div>

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="bio" className="text-right pt-2">
                Full Bio
              </Label>
              <Textarea
                id="bio"
                value={currentMember?.bio || ''}
                onChange={(e) => setCurrentMember({ ...currentMember!, bio: e.target.value })}
                className="col-span-3 min-h-[120px]"
                placeholder="Complete biography shown in detail view"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveMember}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamManagement;
