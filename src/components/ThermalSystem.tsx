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
  const tempGradient = (T: number) => {
    const clamp = Math.min(Math.max(T, START_TEMP), MAX_TEMP);
    const r = Math.floor((255 * clamp) / MAX_TEMP);
    const b = Math.floor(200 * (1 - clamp / MAX_TEMP));
    return `linear-gradient(to top, rgb(${200 + (55 * clamp) / MAX_TEMP},0,${
      150 * (1 - clamp / MAX_TEMP)
    }), rgb(${r},0,${b}))`;
  };

  const pipe = 'h-3 bg-flow-gradient bg-[length:200%_100%] animate-flow rounded';

  return (
    <div className="px-2 py-6 bg-gray-100 rounded-xl shadow-md w-full max-w-5xl mx-auto">
      <h2 className="text-xl font-medium mb-6 text-center">Visual Thermal Simulation</h2>

      {/* Sun & irradiance */}
      <div>
        <div className="flex justify-start items-center gap-4 mb-12">
          <span className="text-4xl md:text-6xl animate-pulse">☀️</span>
          <span className="text-sm text-gray-700">{irradiance} W/m²</span>
        </div>
      </div>
      {/* Main schematic row */}
      <div className="flex items-end gap-0 w-full">
        {/* Panel column */}
        <div className="flex flex-col items-center self-start">
          {/* Top connection stub */}
          <div className={pipe + ' w-8'} />
          <div
            className="w-14 md:w-28 h-48 border rounded text-white flex flex-col items-center justify-center"
            style={{ background: tempGradient(panelTemp) }}
          >
            <span className="text-xs md:text-sm">{panelTemp.toFixed(3)} °F</span>
            <span className="text-[10px] md:text-xs">Solar Panel</span>
            <span className="text-[10px]">η {efficiency.toFixed(2)}</span>
          </div>
          {/* Bottom return stub */}
          <div className={pipe + ' w-8'} />
        </div>

        {/* Pipes + pump block */}
        <div className="flex-1 flex flex-col gap-[5rem] self-center items-stretch min-h-fit">
          {/* Top pipe with pump (panel ➜ tank) */}
          <div className="flex items-center w-full">
            <div className={pipe + ' flex-1'} />
            <div className="hidden sm:block mx-2 bg-green-600 text-white px-2 py-0.5 text-[10px] md:text-xs rounded-full shadow">
              Pump ({fluid}, {flowRate} L/min)
            </div>
            <div className={pipe + ' flex-1 hidden sm:block'} />
          </div>
          {/* Bottom pipe (tank ➜ panel) */}
          <div className="flex w-full justify-between">
            <div className={pipe + ' flex-1'} />
          </div>
        </div>

        {/* Tank column */}
        <div className="flex flex-col items-center self-end">
          {/* Top stub */}
          <div className="h-12" />
          <div className={pipe + ' w-8'} />
          <div
            className="w-14 md:w-28 h-52 border rounded-3xl text-white flex flex-col items-center justify-center"
            style={{ background: tempGradient(tankTemp) }}
          >
            <span className="text-xs md:text-sm">{tankTemp.toFixed(3)} °F</span>
            <span className="text-[10px] md:text-xs">Storage Tank</span>
          </div>
          <div className={pipe + ' w-8'} />
          {/* Return stub aligns visually with bottom pipe */}
        </div>
      </div>
    </div>
  );
};
