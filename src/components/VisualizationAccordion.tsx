import React from 'react';
import { ChevronUpIcon } from '@heroicons/react/24/solid';
import { ThermalSystem } from './ThermalSystem';
import { ChartPanel } from './ChartPanel';
import { SimulationParams } from '../types/index';
import { LoadingSpinner } from './LoadingSpinner';

interface VisualizationAccordionProps {
  isOpen: boolean;
  onToggle: () => void;
  data: any[];
  params: SimulationParams | null;
  defaultValues: SimulationParams;
  isRunning: boolean;
}

export const VisualizationAccordion: React.FC<VisualizationAccordionProps> = ({
  isOpen,
  onToggle,
  data,
  params,
  defaultValues,
  isRunning,
}) => {
  const latestData = data?.[data.length - 1];
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="flex w-full justify-between px-6 py-4 text-left text-lg font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75"
      >
        <span className="text-2xl font-bold">Simulation Visualization</span>
        <ChevronUpIcon
          className={`${isOpen ? 'rotate-180 transform' : ''} h-5 w-5 text-gray-500`}
        />
      </button>
      {isOpen && (
        <>
          {data?.length === 0 ? (
            <div className="flex justify-center items-center px-6 pb-6">
              {isRunning && data?.length === 0 ? <LoadingSpinner /> : 'No data'}
            </div>
          ) : (
            <div className="px-6 pb-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all hover:shadow-xl">
                  <ThermalSystem
                    panelTemp={latestData?.panelTemp ?? 0}
                    tankTemp={latestData?.tankTemp ?? 0}
                    flowRate={params?.flowRate ?? defaultValues.flowRate}
                    fluid={params?.fluid ?? defaultValues.fluid}
                    irradiance={params?.irradiance ?? 0}
                    efficiency={params?.efficiency ?? defaultValues.efficiency}
                  />
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 transform transition-all hover:shadow-xl">
                  <ChartPanel data={data} />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
