import { useReducer, useRef, useCallback, useEffect, useState } from 'react';
import { FLUIDS } from '../models/Fluid';
import { computeHeatInput, computeHeatLoss, computeHeatTransferCoeff } from '../utils/formulas';
import { SimulationState, SimulationParams, SimulationAction } from '../types/index';
import { DEFAULT_PARAMS } from '../constants/simulation';

const MAX_DATA_POINTS = 50; // Maximum number of data points to keep in memory

function getInitialState(params: SimulationParams): SimulationState {
  return {
    time: 0,
    tankTemp: params.initialTemp,
    panelTemp: params.initialTemp,
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
    const Q = computeHeatInput(irradiance, efficiency, panelArea, prevState.panelTemp); // W

    // Compute heat transfer coefficient based on current conditions
    const heatTransferCoeff = computeHeatTransferCoeff(prevState.panelTemp, ambientTemp);
    const Q_loss = computeHeatLoss(panelArea, prevState.panelTemp, ambientTemp, heatTransferCoeff); // W
    const Q_net = Q - Q_loss;

    // --- Flow rate logic with passive return ---
    let effectiveFlowRate = flowRate; // L/min
    if (flowRate <= 0.01) {
      // Pump is off or nearly off
      // Gravity-driven: allow 0.2 L/min per meter elevationDiff if tank is above panel
      let gravityFlow = 0;
      if (elevationDiff > 0) {
        gravityFlow = 0.2 * elevationDiff; // L/min
      }
      // Thermosiphon: allow 0.1 L/min per 10°K panel-tank difference if panel is hotter
      let thermoFlow = 0;
      if (prevState.panelTemp > prevState.tankTemp) {
        thermoFlow = 0.1 * ((prevState.panelTemp - prevState.tankTemp) / 10);
      }
      effectiveFlowRate = Math.max(gravityFlow, thermoFlow, 0); // Use the stronger effect
    }
    // flowRate: L/min -> m^3/s
    const flowRate_m3s = Math.max(effectiveFlowRate, 0) / 1000 / 60; // allow zero
    const massFlowRate = flowRate_m3s * fluidProps.density; // kg/s
    // ΔT_panel = Q_net / (m_dot * cp)
    let deltaT_panel = 0;
    if (massFlowRate > 0) {
      deltaT_panel = Q_net / (massFlowRate * fluidProps.specificHeat);
    }
    // Panel outlet temp = tank temp + ΔT_panel
    const panelOutletTemp = prevState.tankTemp + deltaT_panel;
    // For a well-mixed tank, energy delivered per second:
    // Q_delivered = massFlowRate * cp * (panelOutletTemp - tankTemp)
    const Q_delivered =
      massFlowRate * fluidProps.specificHeat * (panelOutletTemp - prevState.tankTemp);
    // Update tank temp
    const deltaT_tank = Q_delivered / (fluidMass * fluidProps.specificHeat);
    const newTankTemp = prevState.tankTemp + deltaT_tank;
    // Panel temp is the average of inlet and outlet (approximation)
    const newPanelTemp = (prevState.tankTemp + panelOutletTemp) / 2;
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
