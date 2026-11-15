'use client';

import { useState } from 'react';
import { FileText, Image, Link2, Upload, Video } from 'lucide-react';
import MediaAsset from '@/components/MediaAsset';
import { uploadMediaFile } from '@/lib/upload-client';
import { mediaTypeFromFile } from '@/lib/media-type';

const typeOptions = [
  { value: 'image', label: 'Image', icon: Image },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'pdf', label: 'PDF', icon: FileText },
];

export default function MediaPicker({
  value = '',
  mediaType = 'image',
  onChange,
  onUploadingChange,
  allowedTypes = ['image', 'video', 'pdf'],
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const availableTypes = typeOptions.filter((option) => allowedTypes.includes(option.value));
  const SelectedIcon = availableTypes.find((option) => option.value === mediaType)?.icon || Image;
  const accept = allowedTypes.map((type) => ({
    image: 'image/*',
    video: 'video/*',
    pdf: 'application/pdf',
  })[type]).filter(Boolean).join(',');

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const detectedType = mediaTypeFromFile(file);
    if (!allowedTypes.includes(detectedType)) {
      setError(`Choose a ${allowedTypes.join(' or ')} file.`);
      event.target.value = '';
      return;
    }

    setError('');
    setUploading(true);
    onUploadingChange?.(true);
    try {
      const url = await uploadMediaFile(file, { purpose: 'admin' });
      onChange(url, detectedType);
    } catch (uploadError) {
      setError(uploadError.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      event.target.value = '';
    }
  };

  return (
    <div style={{ display: 'grid', gap: '12px' }}>
      {availableTypes.length > 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${availableTypes.length}, minmax(0, 1fr))`, gap: '8px' }}>
          {availableTypes.map(({ value: optionValue, label, icon: Icon }) => (
            <button
              key={optionValue}
              type="button"
              onClick={() => onChange(value, optionValue)}
              aria-pressed={mediaType === optionValue}
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '7px',
                padding: '10px 8px',
                borderRadius: '9px',
                border: `1px solid ${mediaType === optionValue ? 'var(--color-emerald)' : 'var(--color-border)'}`,
                color: mediaType === optionValue ? 'var(--color-forest)' : 'var(--color-text-muted)',
                background: mediaType === optionValue ? '#EBF7F0' : '#FFFFFF',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      )}

      <label
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '13px 15px',
          border: '1px dashed var(--color-emerald)',
          borderRadius: '10px',
          background: '#F8FCF9',
          cursor: uploading ? 'wait' : 'pointer',
        }}
      >
        <span style={{ display: 'grid', placeItems: 'center', width: '38px', height: '38px', borderRadius: '10px', color: 'var(--color-emerald)', background: '#E8F4EC' }}>
          <Upload size={19} aria-hidden="true" />
        </span>
        <span style={{ flex: 1 }}>
          <strong style={{ display: 'block', color: 'var(--color-forest)', fontSize: '0.88rem' }}>
            {uploading ? 'Uploading your file…' : 'Upload from your device'}
          </strong>
          <span style={{ display: 'block', marginTop: '3px', color: 'var(--color-text-muted)', fontSize: '0.76rem' }}>
            {allowedTypes.map((type) => type === 'pdf' ? 'PDF' : `${type[0].toUpperCase()}${type.slice(1)}`).join(', ')} · Up to 25 MB
          </span>
        </span>
        <input
          type="file"
          accept={accept}
          onChange={handleUpload}
          disabled={uploading}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: uploading ? 'wait' : 'pointer' }}
          aria-label={`Upload ${allowedTypes.join(', ')}`}
        />
      </label>

      <div style={{ position: 'relative' }}>
        <Link2 size={16} aria-hidden="true" style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--color-text-subtle)' }} />
        <input
          type="text"
          className="form-input"
          value={value}
          onChange={(event) => {
            setError('');
            onChange(event.target.value, mediaType);
          }}
          placeholder={`Paste an ${mediaType} URL link here`}
          aria-label={`${mediaType} URL`}
          style={{ paddingLeft: '36px' }}
        />
      </div>

      {error && <p role="alert" style={{ margin: 0, color: 'var(--color-danger)', fontSize: '0.8rem' }}>{error}</p>}

      <div style={{ height: '150px', overflow: 'hidden', borderRadius: '10px', border: '1px solid var(--color-border-light)', background: '#F7F9F8', display: 'grid', placeItems: 'center' }}>
        {value ? (
          <MediaAsset url={value} mediaType={mediaType} title="Media preview" />
        ) : (
          <div style={{ display: 'grid', justifyItems: 'center', gap: '7px', color: 'var(--color-text-subtle)', fontSize: '0.82rem' }}>
            <SelectedIcon size={24} aria-hidden="true" />
            Your media preview will appear here
          </div>
        )}
      </div>
    </div>
  );
}
