'use client';

import { useEffect } from 'react';

export default function ScrollReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll('[data-reveal]');
    if (!('IntersectionObserver' in window)) {
      targets.forEach((target) => target.classList.add('is-revealed'));
      return undefined;
    }

    document.documentElement.classList.add('scroll-reveal-ready');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

    targets.forEach((target) => observer.observe(target));
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove('scroll-reveal-ready');
    };
  }, []);

  return null;
}
