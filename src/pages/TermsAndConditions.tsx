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
  title: 'Terms and Conditions',
  lastUpdated: new Date().toISOString(),
  sections: [
    { id: '1', title: 'Acceptance of Terms', content: 'By accessing and using the Amuse Kenya website and services, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services.' },
    { id: '2', title: 'Services Description', content: 'Amuse Kenya provides outdoor education, forest adventures, camps, team building activities, and related services for children and groups at Karura Forest. Our services include but are not limited to day camps, holiday camps, school programs, birthday parties, and corporate team building experiences.' },
    { id: '3', title: 'Registration and Booking', content: 'All participants must complete the registration process before participating in any program. Parents or guardians must provide accurate information for minors. Bookings are confirmed only upon receipt of payment. We reserve the right to refuse service to anyone at our discretion.' },
    { id: '4', title: 'Payment Terms', content: 'Full payment is required to confirm your booking unless otherwise specified. Payments can be made through our accepted payment methods. All prices are in Kenyan Shillings (KES) unless otherwise stated. Prices are subject to change without prior notice.' },
    { id: '5', title: 'Cancellation and Refund Policy', content: 'Cancellations made 7 or more days before the program start date are eligible for a full refund minus a 10% administrative fee. Cancellations made 3-6 days before the program start date are eligible for a 50% refund. Cancellations made less than 3 days before the program start date are non-refundable. No-shows are non-refundable. Amuse Kenya reserves the right to cancel programs due to insufficient enrollment or unforeseen circumstances, in which case a full refund will be provided.' },
    { id: '6', title: 'Safety and Liability', content: 'Parents and guardians must disclose any medical conditions, allergies, or special needs of participants. Participants must follow all safety instructions provided by our staff. Amuse Kenya is not liable for any personal injury, loss, or damage to personal property during activities, except where caused by our negligence. Parents and guardians are responsible for ensuring their children are fit to participate in physical activities.' },
    { id: '7', title: 'Photography and Media', content: 'By participating in our programs, you consent to photographs and videos being taken and used for promotional and marketing purposes unless you explicitly opt out in writing before the program begins.' },
    { id: '8', title: 'Code of Conduct', content: 'All participants are expected to behave respectfully towards staff, other participants, and the environment. Amuse Kenya reserves the right to dismiss any participant whose behavior is deemed inappropriate, without refund.' },
    { id: '9', title: 'Intellectual Property', content: 'All content on this website, including text, images, logos, and graphics, is the property of Amuse Kenya and is protected by copyright laws. Unauthorized use is prohibited.' },
    { id: '10', title: 'Changes to Terms', content: 'Amuse Kenya reserves the right to modify these terms at any time. Changes will be effective immediately upon posting on our website. Continued use of our services constitutes acceptance of the modified terms.' },
    { id: '11', title: 'Contact Information', content: 'For questions about these Terms and Conditions, please contact us at info@amusekenya.co.ke or call 0114 705 763.' },
  ]
};

const TermsAndConditions = () => {
  const [content, setContent] = useState<LegalPageContent>(defaultContent);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      const data = await cmsService.getContentBySlug('terms-and-conditions', 'page');
      if (data && data.metadata && data.status === 'published') {
        setContent(data.metadata);
      }
    } catch (error) {
      console.error('Error loading terms content:', error);
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
        title="Terms and Conditions | Amuse Kenya"
        description="Terms and conditions for using Amuse Kenya services and website."
        canonical="https://amusekenya.co.ke/terms-and-conditions"
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

export default TermsAndConditions;
