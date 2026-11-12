import React from 'react';
import HeroText from './HeroText';
import Arrow from './Arrow';

export default function LeftContent({ onExploreClick }) {
  return (
    <div className="w-full lg:w-2/5 flex flex-col justify-between py-4">
      <HeroText onExploreClick={onExploreClick} />
      <div className="hidden lg:block pl-6 pt-4">
        <Arrow onClick={onExploreClick} />
      </div>
    </div>
  );
}
