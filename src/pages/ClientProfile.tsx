import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientAuth } from '@/hooks/useClientAuth';
import { clientProfileService } from '@/services/clientProfileService';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2, Save, User, Phone, Mail, Baby } from 'lucide-react';
import { Link } from 'react-router-dom';
import GoogleSignInButton from '@/components/GoogleSignInButton';

interface ChildInfo {
  name: string;
  dateOfBirth: string;
  specialNeeds: string;
}

const ClientProfile = () => {
  const navigate = useNavigate();
  const { isSignedIn, isLoading, user, profile, refreshProfile } = useClientAuth();
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [children, setChildren] = useState<ChildInfo[]>([]);

  // Populate form from profile
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setEmail(profile.email || '');
      setPhone(profile.phone || '');
      setChildren(
        Array.isArray(profile.children) && profile.children.length > 0
          ? profile.children
          : []
      );
    }
  }, [profile]);

  const addChild = () => {
    setChildren([...children, { name: '', dateOfBirth: '', specialNeeds: '' }]);
  };

  const removeChild = (index: number) => {
    setChildren(children.filter((_, i) => i !== index));
  };

  const updateChild = (index: number, field: keyof ChildInfo, value: string) => {
    const updated = [...children];
    updated[index] = { ...updated[index], [field]: value };
    setChildren(updated);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const success = await clientProfileService.updateProfile(user.id, {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        children,
      });
      if (success) {
        await refreshProfile();
        toast.success('Profile updated successfully');
      } else {
        toast.error('Failed to update profile');
      }
    } catch {
      toast.error('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
        <Navbar />
        <div className="pt-24 pb-16 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <>
        <SEOHead title="My Profile | Amuse Kenya" description="Manage your profile for faster registrations" />
        <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
          <Navbar />
          <div className="pt-24 pb-16">
            <div className="container mx-auto px-4 max-w-md text-center space-y-6">
              <User className="w-16 h-16 mx-auto text-muted-foreground/40" />
              <h1 className="text-2xl font-bold text-foreground">Sign in to manage your profile</h1>
              <p className="text-muted-foreground">
                Save your details once and enjoy auto-filled forms every time you register for camps and programs.
              </p>
              <GoogleSignInButton />
            </div>
          </div>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead title="My Profile | Amuse Kenya" description="Manage your profile for faster registrations" />
      <div className="min-h-screen bg-gradient-to-br from-forest-50 to-earth-50">
        <Navbar />
        <div className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="mb-8">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-forest-600 hover:text-forest-700 font-medium"
              >
                <ArrowLeft size={20} />
                Back to Home
              </Link>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  My Profile
                </CardTitle>
                <CardDescription>
                  Update your details here. They'll auto-fill every registration form.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Parent/Guardian Details */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4" /> Contact Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        maxLength={100}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        maxLength={255}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 max-w-xs">
                    <Label htmlFor="phone" className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+254 7XX XXX XXX"
                      maxLength={20}
                    />
                  </div>
                </div>

                {/* Children */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Baby className="w-4 h-4" /> Children
                    </h3>
                    <Button type="button" variant="outline" size="sm" onClick={addChild}>
                      <Plus className="w-4 h-4 mr-1" /> Add Child
                    </Button>
                  </div>

                  {children.length === 0 && (
                    <p className="text-sm text-muted-foreground py-4 text-center border border-dashed rounded-lg">
                      No children added yet. Add your children's details to speed up future registrations.
                    </p>
                  )}

                  {children.map((child, index) => (
                    <Card key={index} className="p-4 bg-muted/30">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-sm font-medium text-foreground">Child {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeChild(index)}
                          className="text-destructive hover:text-destructive h-8 w-8 p-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label>Name</Label>
                          <Input
                            value={child.name}
                            onChange={(e) => updateChild(index, 'name', e.target.value)}
                            placeholder="Child's name"
                            maxLength={100}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label>Date of Birth</Label>
                          <Input
                            type="date"
                            value={child.dateOfBirth}
                            onChange={(e) => updateChild(index, 'dateOfBirth', e.target.value)}
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <Label>Special Needs / Allergies</Label>
                          <Input
                            value={child.specialNeeds}
                            onChange={(e) => updateChild(index, 'specialNeeds', e.target.value)}
                            placeholder="Any special needs or dietary requirements"
                            maxLength={500}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Save */}
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Profile'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default ClientProfile;
