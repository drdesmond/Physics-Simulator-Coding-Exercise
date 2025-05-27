import React from 'react';
import { Controller, useForm } from 'react-hook-form';
import { SimulationParams } from '../types/index';
import { FLUIDS } from '../models/Fluid';

export type ControlPanelProps = {
  onStart: (params: SimulationParams) => void;
  onPause: () => void;
  onReset: () => void;
  isRunning: boolean;
  defaultValues: SimulationParams;
  data: any[];
};

const fluidOptions = Object.values(FLUIDS).map((fluid) => ({
  label: fluid.label,
  value: fluid.name,
}));

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onStart,
  onPause,
  onReset,
  isRunning,
  defaultValues,
  data,
}) => {
  const { control, handleSubmit, reset, register } = useForm<SimulationParams>({
    defaultValues,
  });

  const onSubmit = (data: SimulationParams) => {
    // Ensure all numeric values are numbers
    const numericData = {
      ...data,
      irradiance: Number(data.irradiance),
      efficiency: Number(data.efficiency),
      ambientTemp: Number(data.ambientTemp),
      flowRate: Number(data.flowRate),
      tankVolume: Number(data.tankVolume),
      initialTemp: Number(data.initialTemp),
      panelArea: Number(data.panelArea),
      elevationDiff: Number(data.elevationDiff),
    };
    onStart(numericData);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="bg-white rounded-xl shadow-lg p-6 w-full max-w-full mx-auto mt-4 flex flex-col gap-4"
    >
      <h2 className="text-xl font-medium mb-2 text-center">Simulation Parameters</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block font-medium mb-1" htmlFor="fluid">
            Fluid
          </label>

          <select id="fluid" {...register('fluid')} className="w-full border rounded px-3 py-2">
            {fluidOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="irradiance">
            Solar Irradiance (W/m²)
          </label>
          <input
            type="number"
            id="irradiance"
            min={0}
            step={10}
            {...register('irradiance')}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="efficiency">
            Solar Panel Efficiency (0 - 1)
          </label>
          <input
            id="efficiency"
            type="number"
            min={0}
            max={1}
            step={0.01}
            {...register('efficiency')}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium" htmlFor="ambientTemp">
            Ambient Temp (°F)
          </label>
          <span className="block md:hidden lg:block text-xs text-gray-500">
            Outside temp (initial temp of Panel)
          </span>
          <input
            id="ambientTemp"
            type="number"
            min={-40}
            step={1}
            {...register('ambientTemp')}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="flowRate">
            Flow Rate (L/min)
          </label>
          <span className="block md:hidden lg:block text-xs text-gray-500">Pump flow rate</span>
          <input
            id="flowRate"
            type="number"
            min={0}
            step={0.1}
            {...register('flowRate')}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="tankVolume">
            Tank Volume (L)
          </label>
          <span className="block md:hidden lg:block text-xs text-gray-500">Volume of the tank</span>
          <input
            type="number"
            id="tankVolume"
            min={1}
            step={1}
            {...register('tankVolume')}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="initialTemp">
            Initial Tank Temperature (°F)
          </label>
          <input
            id="initialTemp"
            type="number"
            min={-40}
            step={1}
            {...register('initialTemp')}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="panelArea">
            Panel Area (m²)
          </label>
          <input
            id="panelArea"
            type="number"
            min={0.1}
            step={0.1}
            {...register('panelArea')}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="elevationDiff">
            Tank Elevation Difference (m)
          </label>
          <input
            type="number"
            id="elevationDiff"
            min={1}
            step={1}
            {...register('elevationDiff')}
            className="w-full border rounded px-3 py-2"
          />
          <span className="text-xs text-gray-500">
            Difference between the solar panel position and the tank height
          </span>
        </div>
      </div>
      <div className="flex flex-col md:flex-row gap-4 justify-center mt-4">
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold px-6 py-2 rounded shadow disabled:cursor-not-allowed"
          disabled={isRunning && !data}
        >
          Start
        </button>
        <button
          type="button"
          className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-400 text-white font-semibold px-6 py-2 rounded shadow disabled:cursor-not-allowed"
          onClick={onPause}
          disabled={!isRunning}
        >
          Pause
        </button>
        <button
          type="button"
          className="bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-semibold px-6 py-2 rounded shadow disabled:cursor-not-allowed"
          onClick={() => {
            reset(defaultValues);
            onReset();
          }}
        >
          Reset
        </button>
      </div>
    </form>
  );
};
