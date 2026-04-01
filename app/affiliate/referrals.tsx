import { useRouter } from 'expo-router';
import { useEffect } from 'react';

// Redirect to main affiliate dashboard referrals tab
export default function AffiliateReferrals() {
  const router = useRouter();
  useEffect(() => { router.replace('/affiliate'); }, []);
  return null;
}
