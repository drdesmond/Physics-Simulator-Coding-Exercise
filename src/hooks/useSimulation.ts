import { useReducer, useRef, useCallback, useEffect, useState } from 'react';
import { FLUIDS } from '../models/Fluid';
import {
  computeHeatInput,
  computeHeatLoss,
  computeHeatTransferCoeff,
  computeTemperatureChange,
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

    // Compute heat input and losses
    const Q = computeHeatInput(irradiance, efficiency, panelArea, prevState.panelTemp); // W
    const heatTransferCoeff = computeHeatTransferCoeff(prevState.panelTemp, ambientTemp);
    const Q_loss = computeHeatLoss(
      panelArea,
      prevState.panelTemp,
      ambientTemp,
      heatTransferCoeff,
      elevationDiff
    ); // W

    // --- Flow rate logic with passive return ---
    let effectiveFlowRate = flowRate;
    if (flowRate > 0.01) {
      // Pump is on, use the set flow rate
      effectiveFlowRate = flowRate;
    } else if (flowRate > 0) {
      // Pump is nearly off, allow passive flow
      // Gravity-driven: allow 0.2 L/min per meter elevationDiff if tank is above panel
      let gravityFlow = 0;
      if (elevationDiff > 0) {
        gravityFlow = 0.2 * elevationDiff; // L/min
      }
      // Thermosiphon: allow 0.1 L/min per 10°F panel-tank difference if panel is hotter
      let thermoFlow = 0;
      if (prevState.panelTemp > prevState.tankTemp) {
        thermoFlow = 0.1 * ((prevState.panelTemp - prevState.tankTemp) / 10);
      }
      effectiveFlowRate = Math.max(gravityFlow, thermoFlow, 0); // Use the stronger effect
    } else {
      // Flow rate is exactly 0, no flow at all
      effectiveFlowRate = 0;
    }

    // flowRate: L/min -> m^3/s
    const flowRate_m3s = effectiveFlowRate / 1000 / 60;
    const massFlowRate = flowRate_m3s * fluidProps.density; // kg/s

    // Calculate heat transfer between tank and panel
    let Q_tank_to_panel = 0;
    if (massFlowRate > 0) {
      // Heat transfer from tank to panel when tank is hotter
      if (prevState.tankTemp > prevState.panelTemp) {
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
        deltaT_fluid = -Q_tank_to_panel / (massFlowRate * fluidProps.specificHeat);
      } else {
        // Panel is hotter: fluid heats up in panel
        deltaT_fluid = Q_net / (massFlowRate * fluidProps.specificHeat);
      }
    }

    // Panel outlet temp = panel temp + fluid temp change
    const panelOutletTemp = newPanelTemp + deltaT_fluid;

    // For a well-mixed tank, energy delivered per second:
    const Q_delivered =
      massFlowRate * fluidProps.specificHeat * (panelOutletTemp - prevState.tankTemp);

    // Update tank temp
    const deltaT_tank = computeTemperatureChange(Q_delivered, fluidMass, fluidProps.specificHeat);
    const newTankTemp = prevState.tankTemp + deltaT_tank;

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
      dispatch({ type: 'RESET', payload: paramsRef.current });
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
