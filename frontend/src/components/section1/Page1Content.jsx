import React from 'react';
import LeftContent from './LeftContent';
import RightContent from './RightContent';

export default function Page1Content({ engines, onSelectEngine, onExploreClick }) {
  return (
    <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-8 py-6 px-6 md:px-12 lg:px-16 min-h-[82vh]">
      <LeftContent onExploreClick={onExploreClick} />
      <RightContent engines={engines} onSelectEngine={onSelectEngine} />
    </div>
  );
}
