import React, { createContext, useState } from "react";

export const SimulatorContext = createContext();

export function SimulatorProvider({ children }){
  const [timeline, setTimeline] = useState([]); // [{pid,start,duration}]
  const [stats, setStats] = useState({ waitingAvg:0, turnaroundAvg:0 });
  const [running, setRunning] = useState(false);

  return (
    <SimulatorContext.Provider value={{
      timeline, setTimeline,
      stats, setStats,
      running, setRunning
    }}>
      {children}
    </SimulatorContext.Provider>
  );
}
