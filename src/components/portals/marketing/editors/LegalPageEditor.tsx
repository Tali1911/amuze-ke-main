import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { cmsService } from '@/services/cmsService';
import { Loader2 } from 'lucide-react';

interface LegalPageEditorProps {
  pageType: 'terms' | 'privacy';
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

interface LegalSection {
  id: string;
  title: string;
  content: string;
}

interface LegalPageContent {
  title: string;
  lastUpdated: string;
  sections: LegalSection[];
}

const defaultTermsContent: LegalPageContent = {
  title: 'Terms and Conditions',
  lastUpdated: new Date().toISOString(),
  sections: [
    { id: '1', title: 'Acceptance of Terms', content: 'By accessing and using the Amuse Kenya website and services, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.' },
    { id: '2', title: 'Services Description', content: 'Amuse Kenya provides outdoor education, forest adventures, camps, team building activities, and related services for children and groups at Karura Forest.' },
    { id: '3', title: 'Registration and Booking', content: 'All participants must complete the registration process before participating in any program. Parents or guardians must provide accurate information for minors. Bookings are confirmed only upon receipt of payment.' },
    { id: '4', title: 'Payment Terms', content: 'Full payment is required to confirm your booking unless otherwise specified. Payments can be made through our accepted payment methods. All prices are in Kenyan Shillings (KES) unless otherwise stated.' },
    { id: '5', title: 'Cancellation and Refund Policy', content: 'Cancellations made 7 or more days before the program start date are eligible for a full refund minus a 10% administrative fee. Cancellations made 3-6 days before are eligible for a 50% refund. Cancellations made less than 3 days before are non-refundable.' },
    { id: '6', title: 'Safety and Liability', content: 'Parents and guardians must disclose any medical conditions, allergies, or special needs of participants. Participants must follow all safety instructions provided by our staff.' },
    { id: '7', title: 'Photography and Media', content: 'By participating in our programs, you consent to photographs and videos being taken and used for promotional and marketing purposes unless you explicitly opt out in writing before the program begins.' },
    { id: '8', title: 'Contact Information', content: 'For questions about these Terms and Conditions, please contact us at info@amusekenya.co.ke or call 0114 705 763.' },
  ]
};

const defaultPrivacyContent: LegalPageContent = {
  title: 'Privacy Policy',
  lastUpdated: new Date().toISOString(),
  sections: [
    { id: '1', title: 'Introduction', content: 'Amuse Kenya is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.' },
    { id: '2', title: 'Information We Collect', content: 'We may collect personal information that you voluntarily provide when registering for our programs, including name, contact information, child\'s details, emergency contacts, and payment information.' },
    { id: '3', title: 'How We Use Your Information', content: 'We use the collected information for processing registrations, communicating about programs, ensuring participant safety, processing payments, and improving our services.' },
    { id: '4', title: 'Information Sharing', content: 'We do not sell your personal information. We may share your information with service providers, emergency services when necessary, and legal authorities when required by law.' },
    { id: '5', title: 'Data Security', content: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.' },
    { id: '6', title: 'Your Rights', content: 'You have the right to access the personal information we hold about you, request correction of inaccurate information, request deletion, and opt out of marketing communications.' },
    { id: '7', title: 'Children\'s Privacy', content: 'We collect information about children only with parental or guardian consent. Parents have the right to review, update, or request deletion of their child\'s information.' },
    { id: '8', title: 'Contact Us', content: 'If you have questions about this Privacy Policy, please contact us at info@amusekenya.co.ke or call 0114 705 763.' },
  ]
};

export const LegalPageEditor: React.FC<LegalPageEditorProps> = ({
  pageType,
  isOpen,
  onClose,
  onSave
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [content, setContent] = useState<LegalPageContent>(
    pageType === 'terms' ? defaultTermsContent : defaultPrivacyContent
  );
  const [isPublished, setIsPublished] = useState(true);
  const [existingId, setExistingId] = useState<string | null>(null);

  const slug = pageType === 'terms' ? 'terms-and-conditions' : 'privacy-policy';

  useEffect(() => {
    if (isOpen) {
      loadContent();
    }
  }, [isOpen, pageType]);

  const loadContent = async () => {
    setIsLoading(true);
    try {
      const data = await cmsService.getContentBySlug(slug, 'page');
      if (data && data.metadata) {
        setContent(data.metadata);
        setIsPublished(data.status === 'published');
        setExistingId(data.id);
      } else {
        setContent(pageType === 'terms' ? defaultTermsContent : defaultPrivacyContent);
        setExistingId(null);
      }
    } catch (error) {
      console.error('Error loading legal page:', error);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const status: 'published' | 'draft' = isPublished ? 'published' : 'draft';
      
      const contentData = {
        title: content.title,
        slug,
        content_type: 'page' as const,
        status,
        metadata: {
          ...content,
          pageType: pageType,
          lastUpdated: new Date().toISOString()
        }
      };

      let result;
      if (existingId) {
        result = await cmsService.updateContent(existingId, {
          ...contentData,
          status
        });
      } else {
        result = await cmsService.createContent(contentData);
      }

      if (result) {
        toast({ title: `${content.title} saved successfully` });
        onSave();
        onClose();
      } else {
        toast({ title: 'Error saving content', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Error saving legal page:', error);
      toast({ title: 'Error saving content', variant: 'destructive' });
    }
  };

  const updateSection = (id: string, field: 'title' | 'content', value: string) => {
    setContent(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === id ? { ...s, [field]: value } : s
      )
    }));
  };

  const addSection = () => {
    const newId = String(content.sections.length + 1);
    setContent(prev => ({
      ...prev,
      sections: [...prev.sections, { id: newId, title: 'New Section', content: '' }]
    }));
  };

  const removeSection = (id: string) => {
    if (content.sections.length <= 1) return;
    setContent(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== id)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {pageType === 'terms' ? 'Terms and Conditions' : 'Privacy Policy'}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2 flex-1 mr-4">
                <Label>Page Title</Label>
                <Input 
                  value={content.title}
                  onChange={(e) => setContent(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label>Published</Label>
                <Switch checked={isPublished} onCheckedChange={setIsPublished} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Sections</Label>
                <Button type="button" variant="outline" size="sm" onClick={addSection}>
                  Add Section
                </Button>
              </div>

              {content.sections.map((section, index) => (
                <div key={section.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Section {index + 1}</span>
                    {content.sections.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeSection(section.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Title</Label>
                    <Input 
                      value={section.title}
                      onChange={(e) => updateSection(section.id, 'title', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    <Textarea 
                      value={section.content}
                      onChange={(e) => updateSection(section.id, 'content', e.target.value)}
                      rows={4}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LegalPageEditor;
