'use client';

import React from 'react';
import { useTrailerState, useModalActions } from '@/lib/stores/uiStore';
import { TrailerPlayer } from './TrailerPlayer';

export function TrailerModal() {
  const { isOpen, trailerKey, title } = useTrailerState();
  const { closeTrailerModal } = useModalActions();

  if (!isOpen || !trailerKey) return null;

  return (
    <TrailerPlayer
      isOpen={isOpen}
      trailerKey={trailerKey}
      title={title || ''}
      onClose={closeTrailerModal}
    />
  );
}
