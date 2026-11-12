import React from 'react';
import Navbar from './Navbar';
import Page1Content from './Page1Content';

export default function Section1({ engines, activeEngine, onSelectEngine, onExploreClick }) {
  return (
    <section id="hero" className="w-full min-h-screen flex flex-col justify-between bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <Navbar activeEngine={activeEngine} onSelectEngine={onSelectEngine} />
      <Page1Content
        engines={engines}
        activeEngine={activeEngine}
        onSelectEngine={onSelectEngine}
        onExploreClick={onExploreClick}
      />
      <div className="w-full py-2 text-center text-xs text-gray-400 border-t border-gray-100">
        Krishi Setu — Agriculture Intelligence Platform • Pilot: MP & UP
      </div>
    </section>
  );
}
