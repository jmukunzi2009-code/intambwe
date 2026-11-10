import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import RegisterForm from './RegisterForm';

export const metadata = {
  title: 'Register as Student | INTAMBWE',
  description: 'Join the INTAMBWE Youth Leadership initiative. Free registration for secondary school students in Rwanda.',
};

export default async function RegisterPage() {
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

      <main style={{ minHeight: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', backgroundColor: 'var(--color-bg-soft)' }}>
        <div style={{ width: '100%', maxWidth: '640px' }}>
          <RegisterForm />
        </div>
      </main>

      <Footer />
    </>
  );
}
