"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRole } from '@/lib/role-context';
import { LandingPage } from '@/components/landing-page';

export default function Home() {
  const router = useRouter();
  const { currentRole } = useRole();

  useEffect(() => {
    if (currentRole) {
      router.push('/dashboard');
    }
  }, [currentRole, router]);

  return <LandingPage />;
}
