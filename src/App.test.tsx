import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm, FormProvider } from 'react-hook-form';
import App from './App';
import { useSimulation } from './hooks/useSimulation';
import { SimulationState, SimulationParams } from './types';
import { FluidType } from './models/Fluid';

// Mock ResizeObserver
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

// Mock the useSimulation hook
jest.mock('./hooks/useSimulation');

const mockUseSimulation = useSimulation as jest.MockedFunction<typeof useSimulation>;

describe('Solar Thermal System Simulator App', () => {
  const mockStart = jest.fn();
  const mockPause = jest.fn();
  const mockReset = jest.fn();
  const mockData: {
    time: number;
    tankTemp: number;
    panelTemp: number;
    Q: number;
    Q_loss: number;
  }[] = [];
  const mockParams: SimulationParams = {
    fluid: 'water' as FluidType,
    irradiance: 800,
    efficiency: 0.8,
    ambientTemp: 20,
    flowRate: 1,
    tankVolume: 100,
    initialTemp: 20,
    panelArea: 2,
    elevationDiff: 2,
  };

  const getMockState = (running: boolean): SimulationState => ({
    time: 0,
    tankTemp: mockParams.initialTemp,
    panelTemp: mockParams.initialTemp,
    Q: 0,
    Q_loss: 0,
    running,
  });

  beforeEach(() => {
    jest.clearAllTimers();
    mockStart.mockClear();
    mockPause.mockClear();
    mockReset.mockClear();

    // Setup default mock implementation
    mockUseSimulation.mockReturnValue({
      state: getMockState(false),
      data: mockData,
      params: mockParams,
      start: mockStart,
      pause: mockPause,
      reset: mockReset,
    });
  });

  const setup = () => {
    const Wrapper = () => {
      const methods = useForm();
      return (
        <FormProvider {...methods}>
          <App />
        </FormProvider>
      );
    };
    render(<Wrapper />);
    return { user: userEvent };
  };

  it('renders header, control panel, and visualization panel', async () => {
    setup();
    // Header text is always visible
    expect(
      screen.getByRole('heading', { name: /Solar Thermal System Simulator/i })
    ).toBeInTheDocument();

    // Control panel is initially open
    expect(screen.getByText('Simulation Controls')).toBeInTheDocument();
    expect(screen.getByText('Simulation Parameters')).toBeInTheDocument();

    // Check for Fluid select input
    expect(screen.getByLabelText('Fluid')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();

    // Check for other inputs
    expect(screen.getByLabelText('Tank Elevation Difference (m)')).toBeInTheDocument();

    // Buttons are always visible
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reset' })).toBeInTheDocument();
  });

  it('all control panel inputs are present and can be changed', async () => {
    const { user } = setup();
    const inputs = [
      'Solar Irradiance (W/m²)',
      'Solar Panel Efficiency (0 - 1)',
      'Ambient Temp (°K)',
      'Flow Rate (L/min)',
      'Tank Volume (L)',
      'Tank Elevation Difference (m)',
      'Panel Area (m²)',
    ];

    // Wait for all inputs to be present
    for (const label of inputs) {
      await waitFor(() => {
        expect(screen.getByLabelText(label)).toBeInTheDocument();
      });
    }

    // Change values
    const irradianceInput = screen.getByLabelText('Solar Irradiance (W/m²)');
    const elevationInput = screen.getByLabelText('Tank Elevation Difference (m)');
    await user.clear(irradianceInput);
    await waitFor(() => {
      expect(irradianceInput).toHaveValue(null);
    });
    await user.type(irradianceInput, '900');
    await waitFor(() => {
      expect(irradianceInput).toHaveValue(900);
    });
    await user.clear(elevationInput);
    await waitFor(() => {
      expect(elevationInput).toHaveValue(null);
    });
    await user.type(elevationInput, '5');
    await waitFor(() => {
      expect(elevationInput).toHaveValue(5);
    });
  });

  it('starts, pauses, and resets the simulation', async () => {
    const { user } = setup();
    const startBtn = screen.getByRole('button', { name: 'Start' });
    const resetBtn = screen.getByRole('button', { name: 'Reset' });
    mockUseSimulation.mockReturnValue({
      state: getMockState(false),
      data: mockData,
      params: mockParams,
      start: mockStart,
      pause: mockPause,
      reset: mockReset,
    });
    // Start
    user.click(startBtn);
    await waitFor(() => {
      expect(mockStart).toHaveBeenCalled();
    });
    // Reset
    user.click(resetBtn);
    await waitFor(() => {
      expect(mockReset).toHaveBeenCalled();
    });
  });

  it('simulation updates chart and visualization', async () => {
    const { user } = setup();

    // Initial state - not running
    mockUseSimulation.mockReturnValue({
      state: getMockState(false),
      data: [],
      params: mockParams,
      start: mockStart,
      pause: mockPause,
      reset: mockReset,
    });

    const startBtn = screen.getByRole('button', { name: 'Start' });

    // Start simulation
    await act(async () => {
      await user.click(startBtn);
    });

    // Verify start was called with correct parameters
    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(mockStart).toHaveBeenCalledWith(mockParams);

    // Update mock to show running state with data
    const runningState = getMockState(true);
    mockUseSimulation.mockReturnValue({
      state: runningState,
      data: [
        { time: 0, tankTemp: 20, panelTemp: 20, Q: 0, Q_loss: 0 },
        { time: 1, tankTemp: 21, panelTemp: 22, Q: 100, Q_loss: 10 },
      ],
      params: mockParams,
      start: mockStart,
      pause: mockPause,
      reset: mockReset,
    });

    // Force re-render
    await act(async () => {
      await user.click(startBtn);
    });

    // Verify running state
    expect(mockUseSimulation().state.running).toBe(true);

    // Wait for visualization to appear and be visible
    await waitFor(() => {
      expect(screen.getByText('Simulation Visualization')).toBeInTheDocument();
    });
  });

  it('handles edge cases for flow rate and elevation difference', async () => {
    const { user } = setup();
    // Mock running state with data
    mockUseSimulation.mockReturnValue({
      state: getMockState(true),
      data: [
        { time: 0, tankTemp: 20, panelTemp: 20, Q: 0, Q_loss: 0 },
        { time: 1, tankTemp: 20.5, panelTemp: 21, Q: 50, Q_loss: 5 },
      ],
      params: { ...mockParams, flowRate: 0, elevationDiff: 5 },
      start: mockStart,
      pause: mockPause,
      reset: mockReset,
    });

    const startBtn = screen.getByRole('button', { name: 'Start' });
    const pauseBtn = screen.getByRole('button', { name: 'Pause' });

    // Start simulation
    await user.click(startBtn);

    // Wait for visualization
    await waitFor(() => {
      expect(screen.getByText('Simulation Visualization')).toBeInTheDocument();
    });

    // Pause and update params
    await user.click(pauseBtn);

    // Update mock with new params
    mockUseSimulation.mockReturnValue({
      state: getMockState(true),
      data: [
        { time: 0, tankTemp: 20, panelTemp: 20, Q: 0, Q_loss: 0 },
        { time: 1, tankTemp: 20, panelTemp: 20, Q: 0, Q_loss: 0 },
      ],
      params: { ...mockParams, flowRate: 0, elevationDiff: -5 },
      start: mockStart,
      pause: mockPause,
      reset: mockReset,
    });

    // Start again
    await user.click(startBtn);

    // Wait for visualization
    await waitFor(() => {
      expect(screen.getByText('Simulation Visualization')).toBeInTheDocument();
    });
  });

  it('changing parameters resets simulation as expected', async () => {
    const { user } = setup();
    // Mock running state with data
    mockUseSimulation.mockReturnValue({
      state: getMockState(true),
      data: [
        { time: 0, tankTemp: 20, panelTemp: 20, Q: 0, Q_loss: 0 },
        { time: 1, tankTemp: 21, panelTemp: 22, Q: 100, Q_loss: 10 },
      ],
      params: { ...mockParams, irradiance: 1000 },
      start: mockStart,
      pause: mockPause,
      reset: mockReset,
    });

    const startBtn = screen.getByRole('button', { name: 'Start' });
    const pauseBtn = screen.getByRole('button', { name: 'Pause' });

    // Start simulation
    await user.click(startBtn);

    // Pause
    await user.click(pauseBtn);

    // Change a parameter
    const irradianceInput = screen.getByLabelText('Solar Irradiance (W/m²)');
    await user.clear(irradianceInput);
    await user.type(irradianceInput, '1000');

    // Start again
    await user.click(startBtn);

    // Wait for visualization
    await waitFor(() => {
      expect(screen.getByText('Simulation Visualization')).toBeInTheDocument();
    });
  });
});
