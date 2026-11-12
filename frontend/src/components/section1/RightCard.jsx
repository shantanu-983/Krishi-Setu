import React from 'react';
import RightCardContent from './RightCardContent';

export default function RightCard(props) {
  return (
    <div
      onClick={() => props.onSelectEngine?.(props.engineKey)}
      className="h-[460px] md:h-[500px] shrink-0 overflow-hidden relative w-72 md:w-80 rounded-4xl shadow-xl hover:shadow-2xl transition duration-300 cursor-pointer group"
    >
      <img
        className="h-full w-full object-cover group-hover:scale-105 transition duration-500"
        src={props.img}
        alt={props.title || props.tag}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20"></div>
      <RightCardContent {...props} />
    </div>
  );
}
