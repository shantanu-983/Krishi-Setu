import React from 'react';

export default function Arrow({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Scroll to Decision Workspace"
      className="text-6xl lg:text-7xl text-gray-400 hover:text-black hover:translate-x-2 transition duration-300 cursor-pointer block"
    >
      <i className="ri-arrow-right-up-line"></i>
    </button>
  );
}
