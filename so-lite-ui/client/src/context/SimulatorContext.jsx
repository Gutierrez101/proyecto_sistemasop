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
  
  // NUEVO: Estado compartido para el algoritmo actual
  const [currentAlgorithm, setCurrentAlgorithm] = useState('FCFS');
  const [currentQuantum, setCurrentQuantum] = useState(4);

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
    setCurrentAlgorithm('FCFS');
    setCurrentQuantum(4);
  };

  // Detectar cuando se recarga la página
  useEffect(() => {
    const handleBeforeUnload = () => {
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
        currentAlgorithm,
        currentQuantum,
        timestamp: Date.now()
      }));
    }
  }, [timeline, stats, currentAlgorithm, currentQuantum]);

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
          setCurrentAlgorithm(parsed.currentAlgorithm || 'FCFS');
          setCurrentQuantum(parsed.currentQuantum || 4);
        } else {
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
    resetState,
    // NUEVO: Exponer el algoritmo actual
    currentAlgorithm,
    setCurrentAlgorithm,
    currentQuantum,
    setCurrentQuantum
  };

  return (
    <SimulatorContext.Provider value={contextValue}>
      {children}
    </SimulatorContext.Provider>
  );
}