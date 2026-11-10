import React, { Suspense } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LoginForm from './LoginForm';

export const metadata = {
  title: 'Sign In | INTAMBWE Leadership Platform',
  description: 'Sign in to access your student leadership portal, journal, registered conferences, and administrative dashboard.',
};

export default async function LoginPage() {
  const currentUser = await getCurrentUser();
  if (currentUser) {
    if (currentUser.role === 'student') {
      redirect('/dashboard/student');
    } else {
      redirect('/dashboard/admin');
    }
  }

  return (
    <>
      <Navbar currentUser={null} />

      <main style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', backgroundColor: 'var(--color-bg-soft)' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          <Suspense fallback={<div className="card" style={{ padding: '36px', textAlign: 'center' }}>Loading...</div>}>
            <LoginForm />
          </Suspense>
        </div>
      </main>

      <Footer />
    </>
  );
}
