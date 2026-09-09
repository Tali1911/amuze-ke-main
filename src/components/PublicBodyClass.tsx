import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Routes that are NOT public-facing (admin/staff portals and internal tools)
const NON_PUBLIC_PREFIXES = [
  '/admin',
  '/test/',
  '/scan/',
];

export const PublicBodyClass = () => {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const isNonPublic = NON_PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p));
    if (isNonPublic) {
      document.body.classList.remove('is-public');
    } else {
      document.body.classList.add('is-public');
    }
  }, [location.pathname]);

  return null;
};

export default PublicBodyClass;
