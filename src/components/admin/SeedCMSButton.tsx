import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { seedAllContent } from '@/scripts/seedCMSContent';
import { toast } from '@/hooks/use-toast';
const SeedCMSButton: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingComplete, setSeedingComplete] = useState(false);
  const handleSeedContent = async () => {
    setIsSeeding(true);
    try {
      const success = await seedAllContent();
      if (success) {
        setSeedingComplete(true);
        toast({
          title: "Content Seeded Successfully",
          description: "All existing website content has been imported into the CMS. You can now manage it from the Marketing Portal."
        });
      } else {
        toast({
          title: "Seeding Failed",
          description: "There was an error importing content. Please check the console for details.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Seeding error:', error);
      toast({
        title: "Error",
        description: "Failed to seed content. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSeeding(false);
    }
  };
  return <Card>
      
      
    </Card>;
};
export default SeedCMSButton;