'use client';

import { useState } from 'react';
import { Award, ExternalLink } from 'lucide-react';

export default function CourseCertificateButton({ articleId, certificateCode }) {
  const [loading, setLoading] = useState(false);
  const [issuedCode, setIssuedCode] = useState(certificateCode);
  const [error, setError] = useState('');

  const issueCertificate = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/certificates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not issue the course certificate.');
      setIssuedCode(data.certificate.certificate_code);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  if (issuedCode) {
    return (
      <a className="btn btn-outline btn-sm" href={`/certificates/${issuedCode}`}>
        <Award size={15} /> View certificate <ExternalLink size={13} />
      </a>
    );
  }

  return (
    <div>
      <button className="btn btn-gold btn-sm" type="button" onClick={issueCertificate} disabled={loading}>
        <Award size={15} /> {loading ? 'Preparing…' : 'Get certificate'}
      </button>
      {error && <p role="alert" style={{ color: 'var(--color-danger)', fontSize: '0.78rem', marginTop: '5px' }}>{error}</p>}
    </div>
  );
}
