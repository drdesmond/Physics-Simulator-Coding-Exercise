import React from 'react';
import { SimulationParams } from '../types/index';

const MAX_TEMP = 10000; // 10000°F
const START_TEMP = -40; // -40°F

interface ThermalSystemProps
  extends Pick<SimulationParams, 'fluid' | 'irradiance' | 'flowRate' | 'efficiency'> {
  panelTemp: number;
  tankTemp: number;
}

export const ThermalSystem: React.FC<ThermalSystemProps> = ({
  panelTemp,
  tankTemp,
  fluid,
  irradiance,
  flowRate,
  efficiency,
}) => {
  const getGradient = (temp: number) => {
    const clamped = Math.min(Math.max(temp, START_TEMP), MAX_TEMP);
    const ratio = clamped / MAX_TEMP;

    const redTop = Math.floor(255 * ratio);
    const blueTop = Math.floor(200 * (1 - ratio));

    const redBottom = Math.floor(200 + 55 * ratio);
    const blueBottom = Math.floor(150 * (1 - ratio));

    return `linear-gradient(to top, rgb(${redBottom}, 0, ${blueBottom}), rgb(${redTop}, 0, ${blueTop}))`;
  };

  return (
    <div className="px-1 md:px-6 py-6 bg-gray-100 rounded-xl shadow-md w-full max-w-6xl mx-auto">
      <h2 className="text-xl font-medium mb-6 text-center">Visual Thermal Simulation</h2>

      {/* Sun + solar rays */}
      <div className="flex items-start gap-0 md:gap-4 mb-6">
        <div className="flex flex-col items-center">
          <div className="text-yellow-500 text-3xl md:text-5xl animate-pulse">☀️</div>
          <p className="text-xs text-gray-700 text-center">
            Irradiance: <br />
            {irradiance} W/m²
          </p>
          <div className="flex flex-col mt-2 gap-1 text-yellow-500 text-sm md:text-2xl">
            <span className="-rotate-45 animate-pulse">➤</span>
            <span className="-rotate-45 animate-pulse">➤</span>
            <span className="-rotate-45 animate-pulse">➤</span>
          </div>
        </div>

        {/* System Block */}
        <div className="flex flex-col w-full gap-0">
          {/* Top pipe with pump */}
          <div className="flex items-end justify-between w-full lg:max-w-sm self-end">
            <div className="h-3 bg-flow-gradient bg-[length:200%_100%] animate-flow relative overflow-hidden flex-1 rounded" />
            <div className="hidden md:flex bg-green-500 text-white px-3 py-1 text-xs font-bold rounded-full shadow items-center justify-center">
              <p>
                Pump ({fluid}, {flowRate} L/h)
              </p>
            </div>
            <div className="hidden md:block h-3 bg-flow-gradient bg-[length:200%_100%] animate-flow relative overflow-hidden flex-1 rounded md:mr-12" />
          </div>

          {/* Main row: panel and tank */}
          <div className="flex justify-between items-end w-full gap-10 z-10">
            {/* Solar Panel */}
            <div className="flex flex-col items-center self-start">
              <div className="w-4 h-6 bg-flow-gradient bg-[length:200%_100%] animate-flow relative overflow-hidden mb-0 mt-0" />
              <div
                className="mb-[-2px] mt-0 w-12 md:w-28 h-44 border rounded text-white flex flex-col items-center justify-center"
                style={{ background: getGradient(panelTemp) }}
              >
                <span>{panelTemp.toFixed(3)}°F</span>
                <span className="text-xs">Solar Panel</span>
                <span className="text-xs">Eff: {efficiency.toFixed(2)}</span>
              </div>
              <div className="w-4 h-20 bg-flow-gradient bg-[length:200%_100%] animate-flow relative overflow-hidden mt-0" />
            </div>

            {/* Storage Tank */}
            <div className="flex flex-col items-center">
              <div className="w-4 h-32 bg-flow-gradient bg-[length:200%_100%] animate-flow relative overflow-hidden mb-0 mt-0" />
              <div
                className="mb-[-2px] mt-0 w-12 md:w-28 h-44 border rounded-3xl text-white flex flex-col items-center justify-center"
                style={{ background: getGradient(tankTemp) }}
              >
                <span>{tankTemp.toFixed(3)}°F</span>
                <span className="text-xs">Storage Tank</span>
              </div>
            </div>
          </div>

          {/* Bottom return pipe: tank → panel */}
          <div className="flex justify-end w-full relative mt-[-25px] lg:max-w-sm self-end">
            <div className="h-3 bg-flow-gradient bg-[length:200%_100%] animate-flow relative overflow-hidden flex-1 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
};
