
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/use-toast';

interface UseSessionTimeoutProps {
  timeoutDuration?: number; // Duration in milliseconds
  warningDuration?: number; // Duration in milliseconds before timeout to show warning
  onTimeout?: () => void; // Optional callback to run on timeout
  redirectPath?: string; // Path to redirect to after timeout
}

/**
 * Hook to handle session timeout after period of inactivity
 */
export const useSessionTimeout = ({
  timeoutDuration = 3 * 60 * 1000, // Default: 3 minutes
  warningDuration = 30 * 1000, // Default: 30 seconds warning before timeout
  onTimeout,
  redirectPath = '/',
}: UseSessionTimeoutProps = {}) => {
  const navigate = useNavigate();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  
  const resetTimer = () => {
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (warningRef.current) {
      clearTimeout(warningRef.current);
      warningRef.current = null;
    }
    
    // Set warning timeout
    warningRef.current = setTimeout(() => {
      toast({
        title: "Session Expiring Soon",
        description: "You'll be logged out in 30 seconds due to inactivity.",
        variant: "destructive",
        duration: 10000, // Show warning for 10 seconds
      });
    }, timeoutDuration - warningDuration);
    
    // Set session timeout
    timeoutRef.current = setTimeout(() => {
      // Execute the onTimeout callback if provided
      if (onTimeout) {
        onTimeout();
      }
      
      // Notify the user
      toast({
        title: "Session Expired",
        description: "You have been logged out due to inactivity.",
        duration: 3000,
      });
      
      // Redirect to the specified path
      navigate(redirectPath);
    }, timeoutDuration);
  };
  
  useEffect(() => {
    // Events to track user activity
    const activityEvents = [
      'mousedown', 'mousemove', 'keydown', 
      'scroll', 'touchstart', 'click'
    ];
    
    // Reset timer on user activity
    const handleUserActivity = () => {
      resetTimer();
    };
    
    // Initialize the timer
    resetTimer();
    
    // Add event listeners for user activity
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    // Clean up on unmount
    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [timeoutDuration, warningDuration, redirectPath]);
  
  return {
    resetTimer,
  };
};
