import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, CheckCircle, Settings, FormInput, Eye, EyeOff } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/hooks/use-toast';
import { cmsService, ContentItem } from '@/services/cmsService';
import { HeroSlideEditor } from './editors/HeroSlideEditor';
import ServiceItemEditor from './editors/ServiceItemEditor';
import AboutSectionEditor from './editors/AboutSectionEditor';
import { TestimonialEditor } from './editors/TestimonialEditor';
import { TeamMemberEditor } from './editors/TeamMemberEditor';
import { ProgramEditor } from './editors/ProgramEditor';
import { SiteSettingsEditor } from './editors/SiteSettingsEditor';
import AdminGalleryManager from '@/components/AdminGalleryManager';
import { AnnouncementEditorDialog } from './editors/AnnouncementEditorDialog';
import AdminCalendar from '@/components/admin/AdminCalendar';
import NavigationManager from './NavigationManager';
import SeedCMSButton from '@/components/admin/SeedCMSButton';
import { CampPageEditor } from './editors/CampPageEditor';
import { CampFormEditor } from './editors/CampFormEditor';
import { LittleForestEditor } from './editors/LittleForestEditor';
import { ProgramFormEditor } from './editors/ProgramFormEditor';
import { ActivityDetailEditor } from './editors/ActivityDetailEditor';
import { LegalPageEditor } from './editors/LegalPageEditor';
import { PartiesPageEditor } from './editors/PartiesPageEditor';
import { TeamBuildingEditor } from './editors/TeamBuildingEditor';
import { ExperiencePageEditor } from './editors/ExperiencePageEditor';
import { SchoolAdventuresPageEditor } from './editors/SchoolAdventuresPageEditor';
import { HomeschoolingPageEditor } from './editors/HomeschoolingPageEditor';
import { KenyanExperiencesPageEditor } from './editors/KenyanExperiencesPageEditor';
import MediaLibrary from './MediaLibrary';
import { BlogPostEditor } from './editors/BlogPostEditor';
type EditorType = 'hero' | 'program' | 'announcement' | 'testimonial' | 'team' | 'settings' | 'about' | 'service' | 'camp-page' | 'camp-form' | 'little-forest' | 'program-form' | 'activity-detail' | 'legal-terms' | 'legal-privacy' | 'parties-page' | 'team-building-page' | 'experience-page' | 'school-adventures-page' | 'homeschooling-page' | 'kenyan-experiences-page' | 'blog-post' | null;
const ContentManagement = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('hero');
  const [heroSlides, setHeroSlides] = useState<ContentItem[]>([]);
  const [programs, setPrograms] = useState<ContentItem[]>([]);
  const [announcements, setAnnouncements] = useState<ContentItem[]>([]);
  const [testimonials, setTestimonials] = useState<ContentItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<ContentItem[]>([]);
  const [aboutSections, setAboutSections] = useState<ContentItem[]>([]);
  const [serviceItems, setServiceItems] = useState<ContentItem[]>([]);
  const [campPages, setCampPages] = useState<ContentItem[]>([]);
  const [campForms, setCampForms] = useState<ContentItem[]>([]);
  const [programForms, setProgramForms] = useState<ContentItem[]>([]);
  const [activityDetails, setActivityDetails] = useState<ContentItem[]>([]);
  const [experiencePages, setExperiencePages] = useState<ContentItem[]>([]);
  const [blogPosts, setBlogPosts] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeEditor, setActiveEditor] = useState<EditorType>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  useEffect(() => {
    loadAllContent();
  }, []);
  const loadAllContent = async () => {
    setIsLoading(true);
    const [heroData, programData, announcementData, testimonialData, teamData, aboutData, serviceData, campPageData, campFormData, programFormData, activityDetailData, experiencePageData, blogData] = await Promise.all([cmsService.getAllContent('hero_slide'), cmsService.getAllContent('program'), cmsService.getAllContent('announcement'), cmsService.getAllContent('testimonial'), cmsService.getAllContent('team_member'), cmsService.getAllContent('about_section'), cmsService.getAllContent('service_item'), cmsService.getAllContent('camp_page'), cmsService.getAllContent('camp_form'), cmsService.getAllProgramForms(), cmsService.getAllActivityDetails(), cmsService.getAllExperiencePages(), cmsService.getAllContent('post')]);
    setHeroSlides(heroData);
    setPrograms(programData);
    setAnnouncements(announcementData);
    setTestimonials(testimonialData);
    setTeamMembers(teamData);
    setAboutSections(aboutData);
    setServiceItems(serviceData);
    setCampPages(campPageData);
    setCampForms(campFormData);
    setProgramForms(programFormData);
    setActivityDetails(activityDetailData);
    setExperiencePages(experiencePageData);
    setBlogPosts(blogData);
    setIsLoading(false);
  };
  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      const deleted = await cmsService.deleteContent(id);
      if (deleted) {
        toast({
          title: 'Content deleted successfully'
        });
        loadAllContent();
      }
    }
  };
  const handlePublish = async (id: string) => {
    const published = await cmsService.publishContent(id);
    if (published) {
      toast({
        title: 'Content published successfully'
      });
      loadAllContent();
    }
  };
  const openEditor = (type: EditorType, item?: any) => {
    setActiveEditor(type);
    setEditingItem(item || null);
  };
  const closeEditor = () => {
    setActiveEditor(null);
    setEditingItem(null);
  };
  const handleSave = async () => {
    await loadAllContent();
    closeEditor();
    // Dispatch custom event to notify pages to refresh their content
    window.dispatchEvent(new CustomEvent('cms-content-updated'));
  };
  const getStatusBadge = (status: string) => {
    if (status === 'published') return <Badge className="bg-green-100 text-green-800">Published</Badge>;
    if (status === 'draft') return <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>;
    return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
  };
  const renderContentList = (items: ContentItem[], type: EditorType) => {
    if (isLoading) return <div className="text-center py-8">Loading...</div>;
    if (items.length === 0) return <div className="text-center py-8 text-muted-foreground">No items yet. Create your first one!</div>;
    return <div className="space-y-3">
        {items.map(item => <div key={item.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium">{item.title}</h4>
                <p className="text-sm text-muted-foreground mb-2">{item.slug}</p>
                <div className="flex gap-2 items-center flex-wrap">
                  {getStatusBadge(item.status)}
                  {item.metadata?.order && <span className="text-xs text-muted-foreground">Order: {item.metadata.order}</span>}
                  {item.content_type === 'program' && item.metadata?.visible === false && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <EyeOff className="h-3 w-3 mr-1" />
                      Hidden
                    </Badge>}
                  {item.content_type === 'program' && item.metadata?.visible !== false && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <Eye className="h-3 w-3 mr-1" />
                      Visible
                    </Badge>}
                </div>
              </div>
              <div className="flex gap-2">
                {item.status === 'draft' && <Button variant="outline" size="sm" onClick={() => handlePublish(item.id)}>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Publish
                  </Button>}
                <Button variant="outline" size="sm" onClick={() => openEditor(type, item)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>)}
      </div>;
  };
  return <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Website Content Management</h2>
        <p className="text-muted-foreground">Manage all public website content from here</p>
      </div>

      <SeedCMSButton />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {isMobile ? <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select content type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hero">Hero Section</SelectItem>
              <SelectItem value="blog">Blog Posts</SelectItem>
              <SelectItem value="activity-details">Activity Details</SelectItem>
              <SelectItem value="services">Services</SelectItem>
              <SelectItem value="about">About Us</SelectItem>
              <SelectItem value="testimonials">Testimonials</SelectItem>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="programs">Programs</SelectItem>
              <SelectItem value="program-forms">Program Forms</SelectItem>
              <SelectItem value="gallery">Gallery</SelectItem>
              <SelectItem value="announcements">Announcements</SelectItem>
              <SelectItem value="calendar">Calendar</SelectItem>
              <SelectItem value="navigation">Navigation</SelectItem>
              <SelectItem value="camps">Camp Management</SelectItem>
              <SelectItem value="experiences">Experiences</SelectItem>
              <SelectItem value="media">Media Library</SelectItem>
              <SelectItem value="legal">Legal Pages</SelectItem>
              <SelectItem value="settings">Settings</SelectItem>
            </SelectContent>
          </Select> : <TabsList className="grid grid-cols-7 lg:grid-cols-14 gap-1 overflow-x-auto">
            <TabsTrigger value="hero">Hero</TabsTrigger>
            <TabsTrigger value="blog">Blog</TabsTrigger>
            <TabsTrigger value="activity-details">Activities</TabsTrigger>
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="testimonials">Testimonials</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="programs">Programs</TabsTrigger>
            <TabsTrigger value="program-forms">Forms</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="announcements">Announcements</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="navigation">Navigation</TabsTrigger>
            <TabsTrigger value="camps">Camps</TabsTrigger>
            <TabsTrigger value="experiences">Experiences</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="legal">Legal</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>}

        <TabsContent value="hero" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Hero Section Slides</CardTitle>
              <Button onClick={() => openEditor('hero')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Hero Slide
              </Button>
            </CardHeader>
            <CardContent>{renderContentList(heroSlides, 'hero')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blog" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Blog Posts</CardTitle>
              <Button onClick={() => openEditor('blog-post')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Blog Post
              </Button>
            </CardHeader>
            <CardContent>{renderContentList(blogPosts, 'blog-post')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity-details" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Activity Detail Pages</CardTitle>
              <Button onClick={() => openEditor('activity-detail')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Activity Detail
              </Button>
            </CardHeader>
            <CardContent>{renderContentList(activityDetails, 'activity-detail')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="programs" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Programs</CardTitle>
              <Button onClick={() => openEditor('program')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Program
              </Button>
            </CardHeader>
            <CardContent>{renderContentList(programs, 'program')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Announcements</CardTitle>
              <Button onClick={() => openEditor('announcement')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Announcement
              </Button>
            </CardHeader>
            <CardContent>{renderContentList(announcements, 'announcement')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="testimonials" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Testimonials</CardTitle>
              <Button onClick={() => openEditor('testimonial')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Testimonial
              </Button>
            </CardHeader>
            <CardContent>{renderContentList(testimonials, 'testimonial')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Team Members</CardTitle>
              <Button onClick={() => openEditor('team')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Team Member
              </Button>
            </CardHeader>
            <CardContent>{renderContentList(teamMembers, 'team')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>About Us Sections</CardTitle>
              <Button onClick={() => openEditor('about')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </CardHeader>
            <CardContent>{renderContentList(aboutSections, 'about')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>What We Do - Services</CardTitle>
              <Button onClick={() => openEditor('service')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </CardHeader>
            <CardContent>{renderContentList(serviceItems, 'service')}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery">
          <Card>
            <CardHeader>
              <CardTitle>Gallery Management</CardTitle>
              <CardDescription>Upload and manage gallery images</CardDescription>
            </CardHeader>
            <CardContent>
              <AdminGalleryManager currentAdminUsername="marketing" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar">
          <AdminCalendar />
        </TabsContent>

        <TabsContent value="navigation">
          <NavigationManager />
        </TabsContent>

        <TabsContent value="camps" className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Camp Pages</CardTitle>
                <CardDescription>Manage camp page hero sections and details</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? <div className="text-center py-4">Loading...</div> : <div className="space-y-2">
                    {campPages.map(page => <div key={page.id} className="flex justify-between items-center p-3 border rounded hover:bg-muted/50">
                        <div>
                          <p className="font-medium">{page.title}</p>
                          <p className="text-xs text-muted-foreground">{page.slug}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => {
                    setActiveEditor('camp-page');
                    setEditingItem(page.slug);
                  }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>)}
                  </div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Camp Forms</CardTitle>
                <CardDescription>Manage camp registration form configurations</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? <div className="text-center py-4">Loading...</div> : <div className="space-y-2">
                    {campForms.map(form => <div key={form.id} className="flex justify-between items-center p-3 border rounded hover:bg-muted/50">
                        <div>
                          <p className="font-medium">{form.title}</p>
                          <p className="text-xs text-muted-foreground">{form.slug}</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => {
                    setActiveEditor('camp-form');
                    setEditingItem(form.slug);
                  }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>)}
                  </div>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Little Forest Explorers</CardTitle>
                <CardDescription>Manage Little Forest registration form</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Customize the Little Forest Explorers registration form including pricing, field labels, and messages.
                  </p>
                  <Button variant="outline" className="w-full" onClick={() => setActiveEditor('little-forest')}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Little Forest Form
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Group Activities Section */}
          
        </TabsContent>

        <TabsContent value="program-forms" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FormInput className="w-5 h-5" />
                Program Registration Forms
              </CardTitle>
              <CardDescription>
                Manage registration form configurations for all programs. Edit field labels, pricing, messages, and content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? <div className="text-center py-4">Loading...</div> : <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {programForms.map(form => <Card key={form.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">{form.title}</CardTitle>
                        <p className="text-xs text-muted-foreground">{form.slug}</p>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" size="sm" className="w-full" onClick={() => {
                    setActiveEditor('program-form');
                    setEditingItem(form.slug);
                  }}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Form Config
                        </Button>
                      </CardContent>
                    </Card>)}
                  {programForms.length === 0 && <div className="col-span-full text-center py-8 text-muted-foreground">
                      No program forms found. Run the SQL migration to seed program forms.
                    </div>}
                </div>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="experiences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registration Pages (Non-Camp)</CardTitle>
              <CardDescription>Manage page content, media, forms, and SEO for registration pages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Kenyan Experiences</CardTitle>
                    <p className="text-xs text-muted-foreground">/experiences/kenyan-experiences</p>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveEditor('kenyan-experiences-page')}>
                      <Edit className="h-4 w-4 mr-2" /> Edit Page
                    </Button>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Homeschooling</CardTitle>
                    <p className="text-xs text-muted-foreground">/programs/homeschooling</p>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveEditor('homeschooling-page')}>
                      <Edit className="h-4 w-4 mr-2" /> Edit Page
                    </Button>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">School Adventures</CardTitle>
                    <p className="text-xs text-muted-foreground">/programs/school-experience</p>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveEditor('school-adventures-page')}>
                      <Edit className="h-4 w-4 mr-2" /> Edit Page
                    </Button>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Team Building</CardTitle>
                    <p className="text-xs text-muted-foreground">/group-activities/team-building</p>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveEditor('team-building-page')}>
                      <Edit className="h-4 w-4 mr-2" /> Edit Page
                    </Button>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Parties</CardTitle>
                    <p className="text-xs text-muted-foreground">/group-activities/parties</p>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveEditor('parties-page')}>
                      <Edit className="h-4 w-4 mr-2" /> Edit Page
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Media Library</CardTitle>
              <CardDescription>Browse and manage all uploaded photos and videos</CardDescription>
            </CardHeader>
            <CardContent>
              <MediaLibrary embedded />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="legal" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Legal Pages</CardTitle>
              <CardDescription>Manage Terms and Conditions and Privacy Policy content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Terms and Conditions</CardTitle>
                    <p className="text-xs text-muted-foreground">/terms-and-conditions</p>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => openEditor('legal-terms')}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Terms
                    </Button>
                  </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Privacy Policy</CardTitle>
                    <p className="text-xs text-muted-foreground">/privacy-policy</p>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => openEditor('legal-privacy')}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Privacy Policy
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Site Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">Manage global site content like footer information, contact details, and social media links.</p>
                <Button onClick={() => openEditor('settings')}>
                  <Settings className="h-4 w-4 mr-2" />
                  Edit Site Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {activeEditor === 'hero' && <HeroSlideEditor isOpen={true} onClose={closeEditor} slide={editingItem} onSave={handleSave} />}

      {activeEditor === 'program' && <ProgramEditor isOpen={true} onClose={closeEditor} program={editingItem} onSave={handleSave} />}

      {activeEditor === 'announcement' && <AnnouncementEditorDialog isOpen={true} onClose={closeEditor} announcement={editingItem} onSave={handleSave} />}

      {activeEditor === 'testimonial' && <TestimonialEditor isOpen={true} onClose={closeEditor} testimonial={editingItem} onSave={handleSave} />}

      {activeEditor === 'team' && <TeamMemberEditor isOpen={true} onClose={closeEditor} member={editingItem} onSave={handleSave} />}

      {activeEditor === 'about' && <AboutSectionEditor isOpen={true} onClose={closeEditor} item={editingItem} onSave={handleSave} />}

      {activeEditor === 'service' && <ServiceItemEditor isOpen={true} onClose={closeEditor} item={editingItem} onSave={handleSave} />}

      {activeEditor === 'settings' && <SiteSettingsEditor isOpen={true} onClose={closeEditor} onSave={handleSave} />}

      {activeEditor === 'camp-page' && <CampPageEditor isOpen={true} onClose={closeEditor} campSlug={editingItem} onSave={handleSave} />}

      {activeEditor === 'camp-form' && <CampFormEditor isOpen={true} onClose={closeEditor} formSlug={editingItem} onSave={handleSave} />}

      {activeEditor === 'little-forest' && <LittleForestEditor isOpen={true} onClose={closeEditor} onSave={handleSave} />}

      {activeEditor === 'program-form' && <ProgramFormEditor isOpen={true} onClose={closeEditor} formSlug={editingItem} onSave={handleSave} />}

      {activeEditor === 'activity-detail' && <ActivityDetailEditor isOpen={true} onClose={closeEditor} activityDetail={editingItem} onSave={handleSave} heroSlides={heroSlides} />}

      {activeEditor === 'legal-terms' && <LegalPageEditor pageType="terms" isOpen={true} onClose={closeEditor} onSave={handleSave} />}

      {activeEditor === 'legal-privacy' && <LegalPageEditor pageType="privacy" isOpen={true} onClose={closeEditor} onSave={handleSave} />}

      {activeEditor === 'parties-page' && <PartiesPageEditor isOpen={true} onClose={closeEditor} onSave={handleSave} />}

      {activeEditor === 'team-building-page' && <TeamBuildingEditor isOpen={true} onClose={closeEditor} onSave={handleSave} />}

      {activeEditor === 'experience-page' && <ExperiencePageEditor isOpen={true} onClose={closeEditor} experienceSlug={editingItem} onSave={handleSave} />}

      {activeEditor === 'school-adventures-page' && <SchoolAdventuresPageEditor isOpen={true} onClose={closeEditor} onSave={handleSave} />}

      {activeEditor === 'homeschooling-page' && <HomeschoolingPageEditor isOpen={true} onClose={closeEditor} onSave={handleSave} />}

      {activeEditor === 'kenyan-experiences-page' && <KenyanExperiencesPageEditor isOpen={true} onClose={closeEditor} onSave={handleSave} />}

      {activeEditor === 'blog-post' && <BlogPostEditor isOpen={true} onClose={closeEditor} post={editingItem} onSave={handleSave} />}
    </div>;
};
export default ContentManagement;