import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { cmsService } from '@/services/cmsService';
import { Skeleton } from '@/components/ui/skeleton';

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

const defaultContent: LegalPageContent = {
  title: 'Privacy Policy',
  lastUpdated: new Date().toISOString(),
  sections: [
    { id: '1', title: 'Introduction', content: 'Amuse Kenya ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.' },
    { id: '2', title: 'Information We Collect', content: 'We may collect personal information that you voluntarily provide when registering for our programs, including:\n• Name and contact information (email, phone number, address)\n• Child\'s name, age, and relevant health information\n• Emergency contact details\n• Payment information\n• Photos and media (with consent)\n\nWe also automatically collect browser type, device information, IP address, pages visited, and cookies.' },
    { id: '3', title: 'How We Use Your Information', content: 'We use the collected information for:\n• Processing registrations and bookings\n• Communicating about programs, updates, and announcements\n• Ensuring the safety and wellbeing of participants\n• Processing payments and sending invoices\n• Improving our services and website experience\n• Marketing and promotional purposes (with consent)\n• Complying with legal obligations' },
    { id: '4', title: 'Information Sharing', content: 'We do not sell your personal information. We may share your information with:\n• Service providers who assist in operating our business (payment processors, email services)\n• Emergency services when necessary for participant safety\n• Legal authorities when required by law\n• Third parties with your explicit consent' },
    { id: '5', title: 'Data Security', content: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.' },
    { id: '6', title: 'Data Retention', content: 'We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required by law. Registration records may be kept for up to 7 years for legal and administrative purposes.' },
    { id: '7', title: 'Your Rights', content: 'You have the right to:\n• Access the personal information we hold about you\n• Request correction of inaccurate information\n• Request deletion of your information (subject to legal requirements)\n• Opt out of marketing communications\n• Withdraw consent for photo/media use' },
    { id: '8', title: 'Children\'s Privacy', content: 'We collect information about children only with parental or guardian consent. Parents and guardians have the right to review, update, or request deletion of their child\'s information by contacting us directly.' },
    { id: '9', title: 'Cookies', content: 'Our website uses cookies to enhance your browsing experience. You can control cookie preferences through your browser settings. Disabling cookies may affect some website functionality.' },
    { id: '10', title: 'Third-Party Links', content: 'Our website may contain links to third-party websites. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies before providing any personal information.' },
    { id: '11', title: 'Changes to This Policy', content: 'We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last updated" date. We encourage you to review this policy periodically.' },
    { id: '12', title: 'Contact Us', content: 'If you have questions about this Privacy Policy or wish to exercise your rights, please contact us at info@amusekenya.co.ke or call 0114 705 763.\n\nAmuse Kenya\nKarura Forest, Gate F, Thigiri Ridge\nNairobi, Kenya' },
  ]
};

const PrivacyPolicy = () => {
  const [content, setContent] = useState<LegalPageContent>(defaultContent);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const data = await cmsService.getContentBySlug('privacy-policy', 'page');
      if (data && data.metadata && data.status === 'published') {
        setContent(data.metadata);
      }
    } catch (error) {
      console.error('Error loading privacy content:', error);
    }
    setIsLoading(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <>
      <SEOHead 
        title="Privacy Policy | Amuse Kenya"
        description="Privacy policy for Amuse Kenya - how we collect, use, and protect your personal information."
        canonical="https://amusekenya.co.ke/privacy-policy"
      />
      <Navbar />
      <main className="min-h-screen bg-background pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-12 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-8 w-1/2" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-foreground mb-8">{content.title}</h1>
              <p className="text-muted-foreground mb-6">
                Last updated: {formatDate(content.lastUpdated)}
              </p>
              
              <div className="prose prose-lg max-w-none text-foreground space-y-8">
                {content.sections.map((section, index) => (
                  <section key={section.id}>
                    <h2 className="text-2xl font-semibold mb-4">
                      {index + 1}. {section.title}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {section.content}
                    </p>
                  </section>
                ))}
              </div>

              <div className="mt-12 pt-8 border-t border-border">
                <Link to="/" className="text-primary hover:underline">← Back to Home</Link>
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default PrivacyPolicy;
