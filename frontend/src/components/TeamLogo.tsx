'use client';

import React, { useState, useEffect } from 'react';

interface TeamLogoProps {
  logoUrl: string | null | undefined;
  teamName: string;
  className?: string;
  size?: number;
}

export default function TeamLogo({ logoUrl, teamName, className = '', size = 32 }: TeamLogoProps) {
  const [error, setError] = useState(false);

  useEffect(() => {
    setError(false);
  }, [logoUrl]);

  const initials = teamName
    ? teamName
        .split(' ')
        .slice(0, 2)
        .map(w => w[0])
        .join('')
        .toUpperCase()
    : 'FC';

  // Gerar um gradiente de cor baseado nas letras do time para ficar esteticamente dinâmico e consistente
  const getGradient = (text: string) => {
    const charCodeSum = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hues = [
      'from-emerald-500 to-teal-700',
      'from-blue-600 to-indigo-800',
      'from-slate-600 to-slate-800',
      'from-purple-600 to-indigo-900',
      'from-cyan-500 to-blue-700',
      'from-emerald-600 to-slate-900'
    ];
    return hues[charCodeSum % hues.length];
  };

  const gradientClass = getGradient(teamName || 'FC');

  if (error || !logoUrl) {
    return (
      <div 
        className={`rounded-full flex items-center justify-center text-white font-extrabold select-none shadow-inner bg-gradient-to-br ${gradientClass} ${className}`}
        style={{ width: `${size}px`, height: `${size}px`, fontSize: `${size * 0.38}px` }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={`${teamName} Logo`}
      onError={() => setError(true)}
      className={`rounded-full object-contain ${className}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}
