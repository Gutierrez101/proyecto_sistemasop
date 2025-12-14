import React, { useContext } from "react";
import { SimulatorContext } from "../context/SimulatorContext";

export default function StatsPanel(){
  const { stats } = useContext(SimulatorContext);
  
  // Función para formatear números
  const formatNumber = (num) => {
    if (num === undefined || num === null || isNaN(num)) return "0.00";
    return Number(num).toFixed(2);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Título */}
      <div className="stats-card" style={{ marginBottom: 0 }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600 }}>
          Métricas de Rendimiento
        </h4>
      </div>

      {/* Tiempo de Espera Promedio */}
      <div className="stats-card" style={{ marginBottom: 0 }}>
        <h4>Tiempo Espera</h4>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '4px' }}>
          {formatNumber(stats.waitingAvg)} u
        </div>
        <p>Promedio de espera en cola</p>
      </div>

      {/* Tiempo de Retorno */}
      <div className="stats-card" style={{ marginBottom: 0 }}>
        <h4>Tiempo Retorno</h4>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '4px' }}>
          {formatNumber(stats.turnaroundAvg)} u
        </div>
        <p>Tiempo total en el sistema</p>
      </div>

      {/* Tiempo de Respuesta */}
      {stats.responseAvg !== undefined && (
        <div className="stats-card" style={{ marginBottom: 0 }}>
          <h4>Tiempo Respuesta</h4>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '4px' }}>
            {formatNumber(stats.responseAvg)} u
          </div>
          <p>Tiempo hasta primera ejecución</p>
        </div>
      )}

      {/* Throughput */}
      <div className="stats-card" style={{ marginBottom: 0 }}>
        <h4>Throughput</h4>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '4px' }}>
          {stats.throughput || 0}
        </div>
        <p>Procesos completados</p>
      </div>

      {/* Context Switches */}
      <div className="stats-card" style={{ marginBottom: 0 }}>
        <h4>Cambios de Contexto</h4>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--accent)', marginBottom: '4px' }}>
          {stats.contextSwitches || 0}
        </div>
        <p>Total de cambios de contexto</p>
      </div>

      {/* Indicador de Estado */}
      <div style={{
        padding: 12,
        background: stats.throughput > 0 ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 193, 7, 0.1)',
        borderLeft: `3px solid ${stats.throughput > 0 ? '#4caf50' : '#ffc107'}`,
        borderRadius: 2,
        fontSize: '12px',
        color: stats.throughput > 0 ? '#2e7d32' : '#f57f17'
      }}>
        {stats.throughput > 0 ? 'Simulación completada' : 'Esperando simulación...'}
      </div>
    </div>
  );
}