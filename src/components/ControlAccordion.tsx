import React from 'react';
import { ChevronUpIcon } from '@heroicons/react/24/solid';
import { ControlPanel } from './ControlPanel';
import { SimulationParams } from '../types/index';

interface ControlAccordionProps {
  isOpen: boolean;
  onToggle: () => void;
  onStart: (params: SimulationParams) => void;
  onPause: () => void;
  onReset: () => void;
  isRunning: boolean;
  defaultValues: SimulationParams;
  data: any[];
}

export const ControlAccordion: React.FC<ControlAccordionProps> = ({
  isOpen,
  onToggle,
  onStart,
  onPause,
  onReset,
  isRunning,
  defaultValues,
  data,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full justify-between px-6 py-4 text-left text-lg font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75"
      >
        <span className="text-2xl font-bold">Simulation Controls</span>
        <ChevronUpIcon
          className={`${isOpen ? 'rotate-180 transform' : ''} h-5 w-5 text-gray-500`}
        />
      </button>
      {isOpen && (
        <div className="px-6 pb-6">
          <ControlPanel
            onStart={onStart}
            onPause={onPause}
            onReset={onReset}
            isRunning={isRunning}
            defaultValues={defaultValues}
            data={data}
          />
        </div>
      )}
    </div>
  );
};
