import React from 'react';
import 'remixicon/fonts/remixicon.css';
import RightCard from './RightCard';

export default function RightContent({ engines, onSelectEngine }) {
  return (
    <div
      id="right"
      className="w-full lg:w-3/5 h-full flex rounded-4xl overflow-x-auto flex-nowrap gap-6 py-4 px-2 scrollbar-none"
    >
      {engines.map((elem, idx) => (
        <RightCard
          key={elem.engineKey || idx}
          id={idx}
          color={elem.color}
          img={elem.img}
          tag={elem.tag}
          title={elem.title}
          desc={elem.desc}
          icon={elem.icon}
          engineKey={elem.engineKey}
          onSelectEngine={onSelectEngine}
        />
      ))}
    </div>
  );
}
