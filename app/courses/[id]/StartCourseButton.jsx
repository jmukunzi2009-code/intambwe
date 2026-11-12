'use client';

import React, { useState } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';

export default function StartCourseButton({ courseId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const startCourse = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not start this course.');
      window.location.reload();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <p className="alert alert-danger" role="alert">{error}</p>}
      <button type="button" className="btn btn-gold btn-lg" onClick={startCourse} disabled={loading}>
        {loading ? <LoaderCircle size={18} className="course-spin" /> : <ArrowRight size={18} />}
        {loading ? 'Starting course…' : 'Start this course'}
      </button>
    </div>
  );
}
