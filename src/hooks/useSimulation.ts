import { useReducer, useRef, useCallback, useEffect, useState } from 'react';
import { FLUIDS } from '../models/Fluid';
import {
  computeHeatInput,
  computeHeatLoss,
  computeHeatTransferCoeff,
  computeTemperatureChange,
  computeThermosiphonFlow,
} from '../utils/formulas';
import { SimulationState, SimulationParams, SimulationAction } from '../types/index';
import { DEFAULT_PARAMS } from '../constants/simulation';

const MAX_DATA_POINTS = 50; // Maximum number of data points to keep in memory using a FIFO queue

function getInitialState(params: SimulationParams): SimulationState {
  return {
    time: 0,
    tankTemp: params.initialTemp,
    panelTemp: params.ambientTemp,
    Q: 0,
    Q_loss: 0,
    running: false,
  };
}

function simulationReducer(state: SimulationState, action: SimulationAction): SimulationState {
  switch (action.type) {
    case 'TICK':
      return { ...state, ...action.payload, time: state.time + 1 };
    case 'START':
      return { ...getInitialState(action.payload), running: true, ...action.payload };
    case 'PAUSE':
      return { ...state, running: false };
    case 'RESET':
      return getInitialState(action.payload);
    default:
      return state;
  }
}

export function useSimulation() {
  const [state, dispatch] = useReducer(simulationReducer, undefined, () =>
    getInitialState(DEFAULT_PARAMS)
  );
  const stateRef = useRef(state);
  const paramsRef = useRef<SimulationParams | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [data, setData] = useState<
    { time: number; tankTemp: number; panelTemp: number; Q: number; Q_loss: number }[]
  >([]);

  // Keep stateRef in sync with latest state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const tick = useCallback(() => {
    if (!paramsRef.current) return;
    const {
      fluid,
      irradiance,
      efficiency,
      ambientTemp,
      flowRate,
      tankVolume,
      panelArea,
      elevationDiff,
    } = paramsRef.current;

    const fluidProps = FLUIDS[fluid];
    const tankVolumeM3 = tankVolume / 1000;
    const fluidMass = tankVolumeM3 * fluidProps.density;
    const prevState = stateRef.current;

    //1. Calculate the heat input from the solar panel
    // Calculates how much heat the solar panel generates from sunlight
    const Q = computeHeatInput(irradiance, efficiency, panelArea, prevState.panelTemp); // W

    //2. Calculate the heat loss from the solar panel
    // Calculates a coefficient (h) that represents how easily heat can transfer from the panel to the air
    const heatTransferCoeff = computeHeatTransferCoeff(prevState.panelTemp, ambientTemp);
    // Uses the coefficient from computeHeatTransferCoeff to calculate the actual amount of heat lost
    const Q_loss = computeHeatLoss(
      panelArea,
      prevState.panelTemp,
      ambientTemp,
      heatTransferCoeff,
      elevationDiff
    ); // W

    //3. Calculate the flow rate of the fluid
    let effectiveFlowRate = flowRate;
    if (flowRate > 0) {
      // calculates the natural circulation flow rate of fluid in the thermosiphon system
      // based on the temperature difference between the panel and tank, where hotter fluid
      //  rises and colder fluid sinks.
      effectiveFlowRate = computeThermosiphonFlow(
        prevState.panelTemp,
        prevState.tankTemp,
        elevationDiff,
        fluid
      );
      // limits the flow rate to the maximum flow rate
      effectiveFlowRate = Math.min(effectiveFlowRate, flowRate);
    } else {
      // Flow rate is exactly 0, no flow at all
      effectiveFlowRate = 0;
    }
    // flowRate: L/min -> m^3/s
    const flowRate_m3s = effectiveFlowRate / 1000 / 60;
    // The mass flow rate is used to calculate the heat transfer between the panel and tank,
    // which is crucial for determining temperature changes in the system.
    const massFlowRate = flowRate_m3s * fluidProps.density; // kg/s

    //4. Calculate the heat transfer between the tank and panel
    let Q_tank_to_panel = 0;
    if (massFlowRate > 0) {
      // Heat transfer from tank to panel when tank is hotter
      if (prevState.tankTemp > prevState.panelTemp) {
        // The formula is derived from the basic heat transfer equation:
        // Q = m × c × ΔT, rearranged to solve for Q, where Q is the heat transfer,
        // m is the mass of the fluid, c is the specific heat of the fluid,
        // and ΔT is the temperature change.
        Q_tank_to_panel =
          massFlowRate * fluidProps.specificHeat * (prevState.tankTemp - prevState.panelTemp);
      }
    }

    // Net heat to panel = solar input - ambient loss + heat from tank
    const Q_net = Q - Q_loss + Q_tank_to_panel;

    // Calculate panel temperature change due to heat input/loss
    const deltaT_panel = computeTemperatureChange(Q_net, 0, 0, true, panelArea);
    const newPanelTemp = prevState.panelTemp + deltaT_panel;

    // Calculate fluid temperature change in panel
    let deltaT_fluid = 0;

    if (massFlowRate > 0) {
      if (prevState.tankTemp > prevState.panelTemp) {
        // Tank is hotter: fluid cools down in panel
        // The formula is derived from the basic heat transfer equation:
        // Q = m × c × ΔT, where
        //  Q is the heat transfer
        //  m is the mass of the fluid
        //  c is the specific heat of the fluid
        //  ΔT is the temperature change.
        // solving for ΔT
        deltaT_fluid = -Q_tank_to_panel / (massFlowRate * fluidProps.specificHeat);
      } else {
        // Panel is hotter: fluid heats up in panel
        // The formula is derived from the basic heat transfer equation:
        // Q = m × c × ΔT
        //solving for ΔT
        deltaT_fluid = Q_net / (massFlowRate * fluidProps.specificHeat);
      }
    }

    // Panel outlet temp = panel temp + fluid temp change
    const panelOutletTemp = newPanelTemp + deltaT_fluid;

    // For a well-mixed tank, energy delivered per second:
    // Q = m × c × ΔT
    const Q_delivered =
      massFlowRate * fluidProps.specificHeat * (panelOutletTemp - prevState.tankTemp);

    // Update tank temp
    const deltaT_tank = computeTemperatureChange(Q_delivered, fluidMass, fluidProps.specificHeat);
    const newTankTemp = prevState.tankTemp + deltaT_tank;

    //6. Update the tank and panel temperatures
    const tickData = {
      time: prevState.time + 1,
      tankTemp: newTankTemp,
      panelTemp: newPanelTemp,
      Q,
      Q_loss,
    };
    setData((prev) => {
      const newData = [...prev, tickData];
      // If we exceed MAX_DATA_POINTS, remove the oldest points
      if (newData.length > MAX_DATA_POINTS) {
        return newData.slice(-MAX_DATA_POINTS);
      }
      return newData;
    });
    dispatch({ type: 'TICK', payload: tickData });
  }, []);

  const start = useCallback(
    (params: SimulationParams) => {
      paramsRef.current = params;
      dispatch({ type: 'START', payload: params });
      setData([]);
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    },
    [tick]
  );

  const pause = useCallback(() => {
    dispatch({ type: 'PAUSE' });
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const reset = useCallback(() => {
    if (paramsRef.current) {
      dispatch({ type: 'RESET', payload: DEFAULT_PARAMS });
    }
    if (intervalRef.current) clearInterval(intervalRef.current);
    setData([]);
  }, []);

  return {
    state,
    data,
    params: paramsRef.current,
    start,
    pause,
    reset,
  };
}
