import React, { useContext } from "react";
import { SimulatorContext } from "../context/SimulatorContext";

export default function StatsPanel(){
  const { stats } = useContext(SimulatorContext);
  return (
    <div className="stats-card">
      <h3>Estadísticas</h3>
      <h4>Tiempo de Espera</h4>
      <p>Promedio: {stats.waitingAvg?.toFixed(2) ?? "0.00"}s</p>

      <h4>Tiempo de Retorno</h4>
      <p>Promedio: {stats.turnaroundAvg?.toFixed(2) ?? "0.00"}s</p>
    </div>
  );
}
