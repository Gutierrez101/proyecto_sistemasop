import React, { createContext, useState, useEffect } from "react";

export const SimulatorContext = createContext();

export function SimulatorProvider({ children }) {
  const [running, setRunning] = useState(false);
  const [timeline, setTimeline] = useState([]);
  const [stats, setStats] = useState({
    waitingAvg: 0,
    turnaroundAvg: 0,
    responseAvg: 0,
    throughput: 0,
    contextSwitches: 0
  });

  // Función para resetear todo el estado
  const resetState = () => {
    setRunning(false);
    setTimeline([]);
    setStats({
      waitingAvg: 0,
      turnaroundAvg: 0,
      responseAvg: 0,
      throughput: 0,
      contextSwitches: 0
    });
  };

  // Detectar cuando se recarga la página
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Limpiar el estado en localStorage si existe
      localStorage.removeItem('simulatorState');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Auto-guardar estado (opcional)
  useEffect(() => {
    if (timeline.length > 0 || stats.throughput > 0) {
      localStorage.setItem('simulatorState', JSON.stringify({
        timeline,
        stats,
        timestamp: Date.now()
      }));
    }
  }, [timeline, stats]);

  // Recuperar estado al cargar (con validación de tiempo)
  useEffect(() => {
    const savedState = localStorage.getItem('simulatorState');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        const age = Date.now() - parsed.timestamp;
        
        // Solo recuperar si es menor a 5 minutos
        if (age < 5 * 60 * 1000) {
          setTimeline(parsed.timeline || []);
          setStats(parsed.stats || {
            waitingAvg: 0,
            turnaroundAvg: 0,
            responseAvg: 0,
            throughput: 0,
            contextSwitches: 0
          });
        } else {
          // Limpiar si es muy antiguo
          localStorage.removeItem('simulatorState');
        }
      } catch (error) {
        console.error('Error recuperando estado:', error);
        localStorage.removeItem('simulatorState');
      }
    }
  }, []);

  const contextValue = {
    running,
    setRunning,
    timeline,
    setTimeline,
    stats,
    setStats,
    resetState
  };

  return (
    <SimulatorContext.Provider value={contextValue}>
      {children}
    </SimulatorContext.Provider>
  );
}