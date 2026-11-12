import React from 'react';

export default function RightCardContent(props) {
  return (
    <div className="absolute top-0 left-0 h-full w-full p-6 md:p-8 flex flex-col justify-between text-white z-10">
      {/* Top Number Badge & Icon */}
      <div className="flex items-center justify-between">
        <h2 className="bg-white text-gray-900 text-base font-extrabold rounded-full h-10 w-10 md:h-12 md:w-12 flex justify-center items-center shadow-md">
          {props.id + 1}
        </h2>
        {props.icon && (
          <span className="text-xl bg-white/20 backdrop-blur-md p-2 rounded-full">
            <i className={props.icon}></i>
          </span>
        )}
      </div>

      {/* Bottom Text & Action */}
      <div>
        <h3 className="text-xl font-bold mb-1 text-white leading-snug drop-shadow-sm">
          {props.title}
        </h3>
        <p className="text-xs text-gray-200 line-clamp-3 mb-6 leading-relaxed">
          {props.desc}
        </p>

        <div className="flex items-center justify-between">
          <button
            style={{ backgroundColor: props.color || '#059669' }}
            className="text-white text-xs font-bold uppercase tracking-wider px-5 py-2 rounded-full shadow-md hover:brightness-110 transition"
          >
            {props.tag}
          </button>
          <button
            aria-label="Open Engine"
            className="text-white font-medium px-3 py-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/40 transition"
          >
            <i className="ri-arrow-right-line text-lg"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
