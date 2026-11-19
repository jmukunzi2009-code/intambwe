'use client';

import { useRef, useState } from 'react';
import { Award, UserRound, X } from 'lucide-react';
import Image from 'next/image';
import { inferMediaType } from '@/lib/media-type';

const FALLBACK_IMAGE = '/about/profile.png';

export default function AboutTeamCards({ members }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dialogRef = useRef(null);
  const selectedMember = members[selectedIndex];

  if (!members.length) return null;

  const openProfile = (index) => {
    setSelectedIndex(index);
    dialogRef.current?.showModal();
  };

  const selectedImage = selectedMember.image_url || FALLBACK_IMAGE;
  const selectedMediaType = selectedMember.media_type || inferMediaType(selectedImage);

  return (
    <div className="about-team-showcase">
      <div className={`about-team-orbit-stage${members.length > 8 ? ' is-crowded' : ''}`}>
        <div className="about-team-orbit-track" aria-hidden="true" />
        <div className="about-team-orbit-hub">
          <Image
            src="/intambwe-logo.png"
            alt="INTAMBWE"
            width={128}
            height={128}
            unoptimized
          />
          <strong>Leadership begins with a step forward</strong>
          <span>Learn · Think · Connect · Act</span>
        </div>
        <div className="about-team-orbit" role="group" aria-label="Team member portraits arranged in a circle">
          {members.map((member, index) => {
            const angle = (2 * Math.PI * index) / members.length - Math.PI / 2;
            const position = 50 + Math.cos(angle) * 40;
            const imagePosition = 50 + Math.sin(angle) * 40;
            const imageUrl = member.image_url || FALLBACK_IMAGE;
            const mediaType = member.media_type || inferMediaType(imageUrl);

            return (
              <span
                key={member.id}
                className="about-team-orbit-position"
                style={{
                  left: `${position}%`,
                  top: `${imagePosition}%`,
                  '--card-delay': `${index * -0.45}s`,
                }}
              >
                <button
                  type="button"
                  className="about-team-person-card"
                  aria-label={`View ${member.name}, ${member.role || 'INTAMBWE team'}`}
                  onClick={() => openProfile(index)}
                >
                  {mediaType === 'video' || mediaType === 'pdf' ? (
                    <span className="about-team-person-fallback" aria-hidden="true"><UserRound size={30} /></span>
                  ) : (
                    <Image
                      className="about-team-portrait"
                      src={imageUrl}
                      alt=""
                      width={360}
                      height={360}
                      unoptimized
                      loading={index < 4 ? 'eager' : 'lazy'}
                    />
                  )}
                </button>
              </span>
            );
          })}
        </div>
      </div>
      <p className="about-team-circle-hint">Our team moves forward together. Select a card to meet each person.</p>

      <dialog
        ref={dialogRef}
        className="about-team-profile-dialog"
        aria-labelledby="about-team-profile-name"
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
      >
        <article className="about-team-profile-modal" key={selectedMember.id}>
          <button
            type="button"
            className="about-team-profile-close"
            aria-label="Close team member profile"
            onClick={() => dialogRef.current?.close()}
          >
            <X size={20} />
          </button>
          <div className="about-team-profile-image">
            {selectedMediaType === 'video' || selectedMediaType === 'pdf' ? (
              <div className="about-team-featured-fallback" aria-hidden="true"><UserRound size={48} /></div>
            ) : (
              <Image
                src={selectedImage}
                alt={selectedMember.name}
                width={720}
                height={600}
                unoptimized
                preload
              />
            )}
            <span className="about-team-profile-image-shade" aria-hidden="true" />
            <span className="about-team-profile-kicker"><Award size={15} /> Meet our team</span>
          </div>
          <div className="about-team-profile-body">
            <span className="about-team-featured-role">{selectedMember.role || 'INTAMBWE team'}</span>
            <h3 id="about-team-profile-name">{selectedMember.name}</h3>
            <p>{selectedMember.bio || 'Helping young people take meaningful steps toward leadership and community impact.'}</p>
          </div>
        </article>
      </dialog>
    </div>
  );
}
