import React, { useContext, useState } from "react";
import { SimulatorContext } from "../context/SimulatorContext";

export default function AlgorithmForm(){
  const { setTimeline, setStats } = useContext(SimulatorContext);
  const [algorithm, setAlgorithm] = useState("");
  const [quantum, setQuantum] = useState(3);

  // demo: procesos estáticos (puedes cambiar)
  const sampleProcesses = [
    { pid: "P1", arrival: 0, burst: 4, priority: 2 },
    { pid: "P2", arrival: 1, burst: 6, priority: 1 },
    { pid: "P3", arrival: 3, burst: 2, priority: 3 },
    { pid: "P4", arrival: 5, burst: 3, priority: 2 },
  ];

  const run = async () => {
    // import dinámico de algoritmo
    let result = [];
    if(algorithm === "fcfs"){
      const mod = await import("../utils/algorithms/fcfs");
      result = mod.fcfs(sampleProcesses);
    } else if(algorithm === "sjf"){
      const mod = await import("../utils/algorithms/sjf");
      result = mod.sjf(sampleProcesses);
    } else if(algorithm === "rr"){
      const mod = await import("../utils/algorithms/rr");
      result = mod.roundRobin(sampleProcesses, Number(quantum));
    } else if(algorithm === "priority"){
      const mod = await import("../utils/algorithms/priority");
      result = mod.priority(sampleProcesses);
    } else {
      alert("Selecciona un algoritmo");
      return;
    }

    // result: timeline [{pid, start, duration}]
    setTimeline(result.timeline || []);
    setStats(result.stats || { waitingAvg:0, turnaroundAvg:0 });
  };

  return (
    <div className="form-card">
      <h3>Seleccionar Algoritmo</h3>
      <div className="form-row">
        <label>Algoritmo</label>
        <select className="select" value={algorithm} onChange={e=>setAlgorithm(e.target.value)}>
          <option value="">Select</option>
          <option value="fcfs">FCFS</option>
          <option value="sjf">SJF</option>
          <option value="rr">Round Robin</option>
          <option value="priority">Prioridades</option>
        </select>
      </div>

      <div className="form-row">
        <small>QUANTUM (solo Round Robin)</small>
        <input type="number" min="1" value={quantum} onChange={e=>setQuantum(e.target.value)} />
      </div>

      <button className="start-btn" onClick={run}>Empezar</button>
    </div>
  );
}
