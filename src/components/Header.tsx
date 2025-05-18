import React from 'react';
export const Header: React.FC = () => (
  <header className="w-full bg-gradient-to-r from-yellow-200 via-orange-100 to-blue-100 py-8 shadow-md mb-4">
    <div className="max-w-3xl mx-auto px-4 text-center">
      <img
        src="./logo.png"
        alt="Physics Simulator Coding Exercise"
        className="w-20 h-20 mx-auto mb-4"
      />
      <h1 className="text-3xl md:text-5xl font-extrabold text-gray-800 mb-2 drop-shadow-lg">
        Solar Thermal System Simulator
      </h1>
      <p className="text-lg md:text-xl text-gray-600 font-medium">
        Simulate heat transfer from a solar panel to a storage tank in real time. Adjust parameters
        and visualize results.
      </p>
    </div>
  </header>
);
