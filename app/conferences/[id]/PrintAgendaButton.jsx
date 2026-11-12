'use client';

import React from 'react';
import { Printer } from 'lucide-react';

export default function PrintAgendaButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn btn-outline btn-sm no-print"
      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
    >
      <Printer size={15} />
      <span>Print Agenda</span>
    </button>
  );
}
