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
import HomeSectionEditor from './editors/HomeSectionEditor';
import LivePreviewPanel from './LivePreviewPanel';
import SortableHomeSections from './SortableHomeSections';
type EditorType = 'hero' | 'program' | 'announcement' | 'testimonial' | 'team' | 'settings' | 'about' | 'service' | 'camp-page' | 'camp-form' | 'little-forest' | 'program-form' | 'activity-detail' | 'legal-terms' | 'legal-privacy' | 'parties-page' | 'team-building-page' | 'experience-page' | 'school-adventures-page' | 'homeschooling-page' | 'kenyan-experiences-page' | 'blog-post' | 'home-section' | null;
const ContentManagement = () => {
  const isMobile = useIsMobile();
  const [isTabletOrSmaller, setIsTabletOrSmaller] = React.useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );
  React.useEffect(() => {
    const onResize = () => setIsTabletOrSmaller(window.innerWidth < 1024);
    window.addEventListener('resize', onResize);
    onResize();
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const [activeTab, setActiveTab] = useState('hero');
  const [heroSlides, setHeroSlides] = useState<ContentItem[]>([]);
  const [programs, setPrograms] = useState<ContentItem[]>([]);
  const [announcements, setAnnouncements] = useState<ContentItem[]>([]);
  const [testimonials, setTestimonials] = useState<ContentItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<ContentItem[]>([]);
  const [aboutSections, setAboutSections] = useState<ContentItem[]>([]);
  const [homeSections, setHomeSections] = useState<ContentItem[]>([]);
  const [newsSections, setNewsSections] = useState<ContentItem[]>([]);
  const [campSections, setCampSections] = useState<ContentItem[]>([]);
  const [campEditorOpen, setCampEditorOpen] = useState(false);
  const [editingCampItem, setEditingCampItem] = useState<ContentItem | null>(null);
  const [programsPageSections, setProgramsPageSections] = useState<ContentItem[]>([]);
  const [programsPageEditorOpen, setProgramsPageEditorOpen] = useState(false);
  const [editingProgramsPageItem, setEditingProgramsPageItem] = useState<ContentItem | null>(null);
  const [newsEditorOpen, setNewsEditorOpen] = useState(false);
  const [editingNewsItem, setEditingNewsItem] = useState<ContentItem | null>(null);

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
    // Split about_section rows: home-scoped, news-scoped, camp-scoped and about-scoped.
    const homeScoped = (aboutData || []).filter((r: any) => r?.metadata?.scope === 'home');
    const newsScoped = (aboutData || []).filter((r: any) => r?.metadata?.scope === 'news');
    const campScoped = (aboutData || []).filter((r: any) => r?.metadata?.scope === 'camp');
    const programsScoped = (aboutData || []).filter((r: any) => r?.metadata?.scope === 'programs');
    const aboutScoped = (aboutData || []).filter((r: any) => {
      const scope = r?.metadata?.scope || 'about';
      return scope !== 'home' && scope !== 'news' && scope !== 'camp' && scope !== 'programs';
    });
    setAboutSections(aboutScoped);
    setHomeSections([...homeScoped].sort((a: any, b: any) => (a?.metadata?.order ?? 99) - (b?.metadata?.order ?? 99)));
    setNewsSections([...newsScoped].sort((a: any, b: any) => (a?.metadata?.order ?? 99) - (b?.metadata?.order ?? 99)));
    setCampSections([...campScoped].sort((a: any, b: any) => (a?.metadata?.order ?? 99) - (b?.metadata?.order ?? 99)));
    setProgramsPageSections([...programsScoped].sort((a: any, b: any) => (a?.metadata?.order ?? 99) - (b?.metadata?.order ?? 99)));

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
  const handleToggleHomeVisibility = async (item: ContentItem) => {
    const currentlyVisible = item.metadata?.visible !== false;
    const nextMeta = { ...(item.metadata || {}), visible: !currentlyVisible };
    const scope = item.metadata?.scope;
    // Optimistic update on the appropriate list
    if (scope === 'news') {
      setNewsSections(prev => prev.map(s => s.id === item.id ? { ...s, metadata: nextMeta } : s));
    } else if (scope === 'camp') {
      setCampSections(prev => prev.map(s => s.id === item.id ? { ...s, metadata: nextMeta } : s));
    } else if (scope === 'programs') {
      setProgramsPageSections(prev => prev.map(s => s.id === item.id ? { ...s, metadata: nextMeta } : s));
    } else {
      setHomeSections(prev => prev.map(s => s.id === item.id ? { ...s, metadata: nextMeta } : s));
    }

    const updated = await cmsService.updateContent(item.id, { metadata: nextMeta } as any);
    if (updated) {
      toast({ title: currentlyVisible ? 'Section hidden' : 'Section visible' });
      window.dispatchEvent(new CustomEvent('cms-content-updated'));
      loadAllContent();
    } else {
      loadAllContent();
      toast({ title: 'Failed to update visibility', variant: 'destructive' });
    }
  };
  const handleReorderSections = (
    newItems: ContentItem[],
    setter: React.Dispatch<React.SetStateAction<ContentItem[]>>,
  ) => {
    const withOrder = newItems.map((it, idx) => ({
      ...it,
      metadata: { ...(it.metadata || {}), order: (idx + 1) * 10 },
    }));
    // Optimistic UI first — feels instant.
    setter(withOrder);

    // Only persist rows whose order actually changed.
    const changed = withOrder.filter(
      it => (newItems.find(n => n.id === it.id)?.metadata?.order) !== it.metadata.order
        || true // fall through — but we still diff against original below
    );
    // Better diff: compare to prior order from newItems input isn't reliable
    // (already reordered). Instead compare to the DOM order pre-set: use index vs previous metadata.order.
    const toPersist = withOrder.filter((it, idx) => {
      const prevOrder = newItems[idx]?.metadata?.order;
      return prevOrder !== it.metadata.order;
    });

    // Fire-and-forget; don't block the UI on the network round-trip.
    (async () => {
      try {
        await Promise.all(
          toPersist.map(it => cmsService.updateContent(it.id, { metadata: it.metadata } as any))
        );
        window.dispatchEvent(new CustomEvent('cms-content-updated'));
      } catch (err) {
        console.error('Failed to reorder sections', err);
        toast({ title: 'Failed to save order', variant: 'destructive' });
        loadAllContent();
      }
    })();
  };

  const handleReorderHomeSections = (items: ContentItem[]) => handleReorderSections(items, setHomeSections);
  const handleReorderNewsSections = (items: ContentItem[]) => handleReorderSections(items, setNewsSections);
  const handleReorderCampSections = (items: ContentItem[]) => handleReorderSections(items, setCampSections);
  const handleReorderProgramsPageSections = (items: ContentItem[]) => handleReorderSections(items, setProgramsPageSections);

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
  const renderItemRow = (item: ContentItem, type: EditorType) => {
    const scope = item.metadata?.scope;
    const isPageSection = scope === 'home' || scope === 'news' || scope === 'camp';
    const pageLabel = scope === 'news' ? 'news page' : scope === 'camp' ? 'camp page' : scope === 'programs' ? 'programs page' : 'homepage';

    return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-medium">{item.title}</h4>
          <p className="text-sm text-muted-foreground mb-2">{item.slug}</p>
          <div className="flex gap-2 items-center flex-wrap">
            {getStatusBadge(item.status)}
            {item.metadata?.order && <span className="text-xs text-muted-foreground">Order: {item.metadata.order}</span>}
            {(item.content_type === 'program' || isPageSection) && item.metadata?.visible === false && <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <EyeOff className="h-3 w-3 mr-1" />
                Hidden
              </Badge>}
            {(item.content_type === 'program' || isPageSection) && item.metadata?.visible !== false && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Eye className="h-3 w-3 mr-1" />
                Visible
              </Badge>}
            {isPageSection && item.metadata?.section_kind && (
              <Badge variant="secondary" className="text-xs">{item.metadata.section_kind}</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {item.status === 'draft' && <Button variant="outline" size="sm" onClick={() => handlePublish(item.id)}>
              <CheckCircle className="h-4 w-4 mr-1" />
              Publish
            </Button>}
          {isPageSection && (() => {
            const kind = item.metadata?.section_kind;
            const isCustomKind = kind === 'custom' || kind === 'custom_cards';
            const isVisible = item.metadata?.visible !== false;
            const openThisEditor = () => {
              if (scope === 'news') {
                setEditingNewsItem(item);
                setNewsEditorOpen(true);
              } else if (scope === 'camp') {
                setEditingCampItem(item);
                setCampEditorOpen(true);
              } else if (scope === 'programs') {
                setEditingProgramsPageItem(item);
                setProgramsPageEditorOpen(true);
              } else {
                openEditor(type, item);
              }
            };

            return (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  title={isVisible ? `Hide from ${pageLabel}` : `Show on ${pageLabel}`}
                  onClick={() => handleToggleHomeVisibility(item)}
                >
                  {isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Button variant="outline" size="sm" onClick={openThisEditor}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!isCustomKind}
                  title={isCustomKind ? 'Delete section' : 'Built-in sections can only be hidden, not deleted.'}
                  onClick={() => handleDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            );
          })()}
          {!isPageSection && (
            <>
              <Button variant="outline" size="sm" onClick={() => openEditor(type, item)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDelete(item.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
    );
  };
  const renderContentList = (items: ContentItem[], type: EditorType) => {
    if (isLoading) return <div className="text-center py-8">Loading...</div>;
    if (items.length === 0) return <div className="text-center py-8 text-muted-foreground">No items yet. Create your first one!</div>;
    return <div className="space-y-3">
        {items.map(item => <div key={item.id}>{renderItemRow(item, type)}</div>)}
      </div>;
  };
  const renderHomeSectionsList = () => {
    if (isLoading) return <div className="text-center py-8">Loading...</div>;
    if (homeSections.length === 0) return <div className="text-center py-8 text-muted-foreground">No items yet. Create your first one!</div>;
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">Drag the handle on the left of any section to reorder how it appears on the homepage. Order is saved automatically.</p>
        <SortableHomeSections
          items={homeSections}
          renderItem={(item) => renderItemRow(item, 'home-section')}
          onReorder={handleReorderHomeSections}
        />
      </div>
    );
  };
  const renderNewsSectionsList = () => {
    if (isLoading) return <div className="text-center py-8">Loading...</div>;
    if (newsSections.length === 0) return <div className="text-center py-8 text-muted-foreground">No sections yet. Add your first one to build the News & Updates page!</div>;
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">Drag the handle on the left of any section to reorder how it appears on the News &amp; Updates page. Order is saved automatically.</p>
        <SortableHomeSections
          items={newsSections}
          renderItem={(item) => renderItemRow(item, 'home-section')}
          onReorder={handleReorderNewsSections}
        />
      </div>
    );
  };
  const renderCampSectionsList = () => {
    if (isLoading) return <div className="text-center py-8">Loading...</div>;
    if (campSections.length === 0) return <div className="text-center py-8 text-muted-foreground">No sections yet. Add your first one to build the Camp page!</div>;
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">Drag the handle on the left of any section to reorder how it appears on the Camp page. Order is saved automatically.</p>
        <SortableHomeSections
          items={campSections}
          renderItem={(item) => renderItemRow(item, 'home-section')}
          onReorder={handleReorderCampSections}
        />
      </div>
    );
  };

  const renderProgramsPageSectionsList = () => {
    if (isLoading) return <div className="text-center py-8">Loading...</div>;
    if (programsPageSections.length === 0) return <div className="text-center py-8 text-muted-foreground">No sections yet. Add your first one to build the Programs page!</div>;
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">Drag the handle on the left of any section to reorder how it appears on the Programs page. Order is saved automatically.</p>
        <SortableHomeSections
          items={programsPageSections}
          renderItem={(item) => renderItemRow(item, 'home-section')}
          onReorder={handleReorderProgramsPageSections}
        />
      </div>
    );
  };

  return <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Website Content Management</h2>
        <p className="text-muted-foreground">Manage all public website content from here</p>
      </div>

      <SeedCMSButton />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        {isTabletOrSmaller ? <Select value={activeTab} onValueChange={setActiveTab}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select content type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="home">Home Page</SelectItem>
              <SelectItem value="news">News &amp; Updates Page</SelectItem>
              <SelectItem value="camp">Camp Page</SelectItem>
              <SelectItem value="programs-page">Programs Page</SelectItem>

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
          </Select> : <TabsList className="flex flex-wrap justify-start h-auto gap-1 p-1 w-full">
            <TabsTrigger value="home" className="flex-grow-0 px-3 py-1.5 text-sm">Home</TabsTrigger>
            <TabsTrigger value="news" className="flex-grow-0 px-3 py-1.5 text-sm">News &amp; Updates</TabsTrigger>
            <TabsTrigger value="camp" className="flex-grow-0 px-3 py-1.5 text-sm">Camp</TabsTrigger>
            <TabsTrigger value="programs-page" className="flex-grow-0 px-3 py-1.5 text-sm">Programs Page</TabsTrigger>

            <TabsTrigger value="hero" className="flex-grow-0 px-3 py-1.5 text-sm">Hero</TabsTrigger>
            <TabsTrigger value="blog" className="flex-grow-0 px-3 py-1.5 text-sm">Blog</TabsTrigger>
            <TabsTrigger value="activity-details" className="flex-grow-0 px-3 py-1.5 text-sm">Activities</TabsTrigger>
            <TabsTrigger value="services" className="flex-grow-0 px-3 py-1.5 text-sm">Services</TabsTrigger>
            <TabsTrigger value="about" className="flex-grow-0 px-3 py-1.5 text-sm">About</TabsTrigger>
            <TabsTrigger value="testimonials" className="flex-grow-0 px-3 py-1.5 text-sm">Testimonials</TabsTrigger>
            <TabsTrigger value="team" className="flex-grow-0 px-3 py-1.5 text-sm">Team</TabsTrigger>
            <TabsTrigger value="programs" className="flex-grow-0 px-3 py-1.5 text-sm">Programs</TabsTrigger>
            <TabsTrigger value="program-forms" className="flex-grow-0 px-3 py-1.5 text-sm">Forms</TabsTrigger>
            <TabsTrigger value="gallery" className="flex-grow-0 px-3 py-1.5 text-sm">Gallery</TabsTrigger>
            <TabsTrigger value="announcements" className="flex-grow-0 px-3 py-1.5 text-sm">Announcements</TabsTrigger>
            <TabsTrigger value="calendar" className="flex-grow-0 px-3 py-1.5 text-sm">Calendar</TabsTrigger>
            <TabsTrigger value="navigation" className="flex-grow-0 px-3 py-1.5 text-sm">Navigation</TabsTrigger>
            <TabsTrigger value="camps" className="flex-grow-0 px-3 py-1.5 text-sm">Camps</TabsTrigger>
            <TabsTrigger value="experiences" className="flex-grow-0 px-3 py-1.5 text-sm">Experiences</TabsTrigger>
            <TabsTrigger value="media" className="flex-grow-0 px-3 py-1.5 text-sm">Media</TabsTrigger>
            <TabsTrigger value="legal" className="flex-grow-0 px-3 py-1.5 text-sm">Legal</TabsTrigger>
            <TabsTrigger value="settings" className="flex-grow-0 px-3 py-1.5 text-sm">Settings</TabsTrigger>
          </TabsList>}

        <TabsContent value="home" className="space-y-4">
          <LivePreviewPanel path="/" />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Home Page Sections</CardTitle>
                <CardDescription>
                  Toggle visibility for built-in sections (Hero, Announcements, Programs, Calendar, Testimonials),
                  edit typography, and add custom sections. Changes appear in the preview above after saving.
                </CardDescription>
              </div>
              <Button onClick={() => openEditor('home-section')}>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </CardHeader>
            <CardContent>{renderHomeSectionsList()}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="news" className="space-y-4">
          <LivePreviewPanel path="/announcements" />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>News &amp; Updates Page Sections</CardTitle>
                <CardDescription>
                  Toggle visibility for built-in sections (Announcements, Yearly Calendar), edit typography,
                  add custom sections or card grids, and reorder how they appear on the page.
                </CardDescription>
              </div>
              <Button onClick={() => { setEditingNewsItem(null); setNewsEditorOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </CardHeader>
            <CardContent>{renderNewsSectionsList()}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="programs-page" className="space-y-4">
          <LivePreviewPanel path="/programs" />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Programs Page Sections</CardTitle>
                <CardDescription>
                  Build the public Programs overview page. Add custom sections or card grids that
                  describe each programme and link straight to its registration form
                  (Camps, School Adventures, Kenyan Experiences, Group Activities, Homeschooling),
                  edit typography, toggle visibility, and drag to reorder. If no sections exist,
                  the page shows a short "being prepared" message.
                </CardDescription>
              </div>
              <Button onClick={() => { setEditingProgramsPageItem(null); setProgramsPageEditorOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </CardHeader>
            <CardContent>{renderProgramsPageSectionsList()}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="camp" className="space-y-4">
          <LivePreviewPanel path="/camp" />
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Camp Page Sections</CardTitle>
                <CardDescription>
                  Build the public Camp overview page. Add custom sections or card grids that
                  link to individual camps (Easter, Summer, End Year, Mid-Term, Day Camps),
                  edit typography, toggle visibility, and drag to reorder.
                </CardDescription>
              </div>
              <Button onClick={() => { setEditingCampItem(null); setCampEditorOpen(true); }}>
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </CardHeader>
            <CardContent>{renderCampSectionsList()}</CardContent>
          </Card>
        </TabsContent>




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

      {activeEditor === 'home-section' && <HomeSectionEditor isOpen={true} onClose={closeEditor} item={editingItem} onSave={handleSave} />}

      {newsEditorOpen && (
        <HomeSectionEditor
          isOpen={true}
          scope="news"
          onClose={() => { setNewsEditorOpen(false); setEditingNewsItem(null); }}
          item={editingNewsItem}
          onSave={async () => { setNewsEditorOpen(false); setEditingNewsItem(null); await loadAllContent(); window.dispatchEvent(new CustomEvent('cms-content-updated')); }}
        />
      )}

      {programsPageEditorOpen && (
        <HomeSectionEditor
          isOpen={true}
          scope="programs"
          onClose={() => { setProgramsPageEditorOpen(false); setEditingProgramsPageItem(null); }}
          item={editingProgramsPageItem}
          onSave={async () => { setProgramsPageEditorOpen(false); setEditingProgramsPageItem(null); await loadAllContent(); window.dispatchEvent(new CustomEvent('cms-content-updated')); }}
        />
      )}

      {campEditorOpen && (
        <HomeSectionEditor
          isOpen={true}
          scope="camp"
          onClose={() => { setCampEditorOpen(false); setEditingCampItem(null); }}
          item={editingCampItem}
          onSave={async () => { setCampEditorOpen(false); setEditingCampItem(null); await loadAllContent(); window.dispatchEvent(new CustomEvent('cms-content-updated')); }}
        />
      )}

    </div>;
};
export default ContentManagement;