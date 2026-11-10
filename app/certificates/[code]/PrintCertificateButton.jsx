'use client';

import React from 'react';
import { Printer } from 'lucide-react';

export default function PrintCertificateButton() {
  return (
    <button
      onClick={() => window.print()}
      className="btn btn-emerald btn-sm"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
    >
      <Printer size={16} />
      <span>Print Official Certificate</span>
    </button>
  );
}
