import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';

import { useSimulation } from './hooks/useSimulation';
import { ControlAccordion } from './components/ControlAccordion';
import { VisualizationAccordion } from './components/VisualizationAccordion';
import { DEFAULT_PARAMS } from './constants/simulation';

function App() {
  const { state, data, start, pause, reset, params } = useSimulation();
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [isVisualizationOpen, setIsVisualizationOpen] = useState(false);

  useEffect(() => {
    if (state.running) {
      setIsVisualizationOpen(true);
      setIsControlsOpen(false);
    } else {
      setIsControlsOpen(true);
      setIsVisualizationOpen(false);
    }
  }, [state.running]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-yellow-50 to-orange-100">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <ControlAccordion
            isOpen={isControlsOpen}
            onToggle={() => setIsControlsOpen((prev) => !prev)}
            onStart={start}
            onPause={pause}
            onReset={reset}
            isRunning={state.running}
            defaultValues={{ ...DEFAULT_PARAMS, ...(params || {}) }}
            data={data}
          />
          <VisualizationAccordion
            isOpen={isVisualizationOpen}
            onToggle={() => setIsVisualizationOpen((prev) => !prev)}
            data={data}
            params={params}
            defaultValues={{ ...DEFAULT_PARAMS, ...(params || {}) }}
            isRunning={state.running}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
