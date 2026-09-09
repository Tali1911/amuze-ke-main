import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

interface RegistrationPageSkeletonProps {
  showNavbar?: boolean;
  showFooter?: boolean;
}

const RegistrationPageSkeleton: React.FC<RegistrationPageSkeletonProps> = ({
  showNavbar = false,
  showFooter = false,
}) => {
  return (
    <div className="min-h-screen bg-background">
      {showNavbar && (
        <div className="fixed top-0 w-full z-50 py-2 px-4 md:px-8 bg-card/90 shadow-sm">
          <div className="container mx-auto max-w-[1400px]">
            <div className="flex items-center justify-between">
              <Skeleton className="h-10 w-32" />
              <div className="hidden lg:flex items-center gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-4 w-20" />
                ))}
              </div>
              <Skeleton className="lg:hidden h-6 w-6" />
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Back Button */}
        <div className="mb-8">
          <Skeleton className="h-5 w-32" />
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Column - Program Information */}
          <div className="space-y-8">
            {/* Header Section */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-14 h-14 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-10 w-64" />
                  <Skeleton className="h-5 w-40" />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            </div>

            {/* Featured Image Skeleton */}
            <Skeleton className="h-80 w-full rounded-2xl" />

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-start gap-3">
                  <Skeleton className="w-9 h-9 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                </div>
              ))}
            </div>

            {/* Program Cards */}
            <div className="space-y-4">
              <Skeleton className="h-7 w-48" />
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-12 h-12 rounded-full shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-40" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Column - Form Skeleton */}
          <Card className="p-8 sticky top-8">
            <Skeleton className="h-8 w-48 mb-6" />
            
            <div className="space-y-6">
              {/* Form Fields */}
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
              
              {/* Checkboxes */}
              <div className="space-y-3">
                <Skeleton className="h-4 w-20" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-5 rounded" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
              
              {/* Submit Button */}
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </Card>
        </div>
      </div>

      {showFooter && (
        <div className="bg-card mt-16 py-12">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationPageSkeleton;
