import React, { useState, useEffect, useContext } from "react";
import { SimulatorContext } from "../context/SimulatorContext";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function CPUPanel() {
  // ✅ OBTENER EL ALGORITMO DEL CONTEXTO
  const { currentAlgorithm: contextAlgorithm, currentQuantum: contextQuantum } = useContext(SimulatorContext);
  
  const [cpuState, setCpuState] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [processes, setProcesses] = useState([]);
  const [algorithm, setAlgorithm] = useState("FCFS");
  const [quantum, setQuantum] = useState(4);
  const [isRunning, setIsRunning] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(1000);
  const [executionLog, setExecutionLog] = useState([]);
  const [intervalId, setIntervalId] = useState(null);

  // ✅ SINCRONIZAR CON EL CONTEXTO
  useEffect(() => {
    if (contextAlgorithm) {
      setAlgorithm(contextAlgorithm);
    }
  }, [contextAlgorithm]);

  useEffect(() => {
    if (contextQuantum) {
      setQuantum(contextQuantum);
    }
  }, [contextQuantum]);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchSystemState(),
        fetchCPUMetrics(),
        fetchProcesses()
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  // ✅ OBTENER ESTADO COMPLETO DEL SISTEMA (sin ejecutar)
  const fetchSystemState = async () => {
    try {
      const response = await axios.get(`${API_URL}/system/state`);
      const systemState = response.data.data;
      
      if (systemState.cpu) {
        setCpuState(systemState.cpu);
        console.log('📊 Estado CPU:', systemState.cpu);
      }
    } catch (error) {
      console.error("Error obteniendo estado del sistema:", error);
    }
  };

  const fetchCPUMetrics = async () => {
    try {
      const response = await axios.get(`${API_URL}/cpu/metrics`);
      setMetrics(response.data.data);
    } catch (error) {
      console.error("Error obteniendo métricas:", error);
    }
  };

  const fetchProcesses = async () => {
    try {
      const response = await axios.get(`${API_URL}/processes`);
      setProcesses(response.data.data || []);
    } catch (error) {
      console.error("Error obteniendo procesos:", error);
    }
  };

  const scheduleCPU = async () => {
    try {
      const response = await axios.post(`${API_URL}/cpu/schedule`, {
        algorithm: algorithm,
        time_quantum: parseInt(quantum)
      });
      
      setCpuState(response.data.data);
      
      const timestamp = new Date().toLocaleTimeString();
      setExecutionLog(prev => [{
        time: timestamp,
        action: `Ejecutando ${algorithm}`,
        details: response.data.data.running_process ? 
          `Proceso: ${response.data.data.running_process.name}` : 
          'CPU Idle'
      }, ...prev].slice(0, 20));
      
      await fetchCPUMetrics();
      await fetchProcesses();
    } catch (error) {
      console.error("Error en schedule:", error);
    }
  };

  const startScheduling = () => {
    if (isRunning) return;
    
    setIsRunning(true);
    const interval = setInterval(() => {
      scheduleCPU();
    }, simulationSpeed);
    
    setIntervalId(interval);
  };

  const stopScheduling = () => {
    setIsRunning(false);
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  const createNewProcess = async () => {
    const name = prompt("Nombre del proceso:");
    if (!name) return;

    const priority = parseInt(prompt("Prioridad (1-10, menor = mayor prioridad):", "5"));
    const burstTime = parseInt(prompt("Tiempo de ráfaga (unidades):", "10"));
    const memoryRequired = parseInt(prompt("Memoria requerida (KB):", "100"));

    try {
      await axios.post(`${API_URL}/processes/create`, {
        name,
        priority,
        burst_time: burstTime,
        memory_required: memoryRequired
      });
      
      alert(`Proceso "${name}" creado exitosamente`);
      await fetchProcesses();
    } catch (error) {
      console.error("Error creando proceso:", error);
      alert("Error al crear proceso: " + (error.response?.data?.message || error.message));
    }
  };

  useEffect(() => {
    if (isRunning) {
      stopScheduling();
    }
  }, [algorithm, quantum]);

  useEffect(() => {
    fetchAllData();
    
    if (autoRefresh && !isRunning) {
      const interval = setInterval(fetchAllData, 2000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, isRunning]);

  useEffect(() => {
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [intervalId]);

  const getStateColor = (state) => {
    const colors = {
      'NEW': '#9e9e9e',
      'READY': '#2196f3',
      'RUNNING': '#4caf50',
      'WAITING': '#ff9800',
      'TERMINATED': '#f44336'
    };
    return colors[state] || '#9e9e9e';
  };

  const getStateBadge = (state) => {
    const badges = {
      'NEW': 'N',
      'READY': 'R',
      'RUNNING': 'E',
      'WAITING': 'W',
      'TERMINATED': 'T'
    };
    return badges[state] || '?';
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20
      }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)' }}>
          Planificador de CPU
        </h2>
        <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
          <label style={{display: 'flex', alignItems: 'center', gap: 5, fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500}}>
            <input 
              type="checkbox" 
              checked={autoRefresh} 
              onChange={e => setAutoRefresh(e.target.checked)}
              disabled={isRunning}
            />
            Auto-actualizar
          </label>
          <button 
            onClick={fetchAllData}
            disabled={isRunning}
            style={{
              padding: '8px 14px',
              background: isRunning ? '#d0d0d0' : 'var(--accent)',
              color: isRunning ? '#808080' : 'white',
              border: 'none',
              borderRadius: 2,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              fontSize: '13px',
              transition: 'background-color 0.15s'
            }}
          >
            Actualizar
          </button>
        </div>
      </div>

      {/* ✅ MOSTRAR INFORMACIÓN DE LA SIMULACIÓN EJECUTADA */}
      {contextAlgorithm && (
        <div style={{
          background: 'rgba(76, 175, 80, 0.1)',
          border: '2px solid #4caf50',
          borderRadius: 4,
          padding: 16,
          marginBottom: 20
        }}>
          <div style={{fontSize: 14, fontWeight: 600, color: '#2e7d32', marginBottom: 8}}>
            ✅ Simulación Ejecutada en AlgorithmForm
          </div>
          <div style={{fontSize: 13, color: '#2e7d32'}}>
            <strong>Algoritmo:</strong> {contextAlgorithm}
            {contextAlgorithm === 'RR' && ` • Quantum: ${contextQuantum}`}
          </div>
        </div>
      )}

      {/* Estado del CPU */}
      {cpuState ? (
        <div style={{ 
          background: 'var(--bg-primary)',
          padding: 20,
          borderRadius: 4,
          marginBottom: 20,
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{marginTop: 0, marginBottom: 16, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)'}}>
            Estado Actual del CPU
          </h3>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: 15,
            marginBottom: 16
          }}>
            <div>
              <div style={{fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6}}>Algoritmo Activo</div>
              <div style={{fontSize: 18, fontWeight: 'bold', color: 'var(--accent)'}}>
                {contextAlgorithm || cpuState.algorithm || 'N/A'}
              </div>
            </div>
            <div>
              <div style={{fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6}}>Quantum</div>
              <div style={{fontSize: 18, fontWeight: 'bold', color: 'var(--accent)'}}>
                {contextQuantum || cpuState.time_quantum || 0}
              </div>
            </div>
            {((contextAlgorithm === 'RR' || cpuState.algorithm === 'RR') && cpuState.quantum_counter !== undefined) && (
              <div>
                <div style={{fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6}}>Contador Quantum</div>
                <div style={{fontSize: 18, fontWeight: 'bold', color: 'var(--accent)'}}>
                  {cpuState.quantum_counter} / {contextQuantum || cpuState.time_quantum}
                </div>
              </div>
            )}
            <div>
              <div style={{fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6}}>Cola Ready</div>
              <div style={{fontSize: 18, fontWeight: 'bold', color: 'var(--accent)'}}>
                {cpuState.ready_queue_size || 0}
              </div>
            </div>
          </div>
          
          {cpuState.running_process ? (
            <div style={{ 
              padding: 15,
              background: 'var(--gantt-bg)',
              borderRadius: 2,
              border: '1px solid var(--border-color)'
            }}>
              <strong style={{fontSize: 13, color: 'var(--text-primary)', display: 'block', marginBottom: 10}}>
                Proceso en Ejecución
              </strong>
              <div style={{marginTop: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12, color: 'var(--text-secondary)'}}>
                <div><strong style={{color: 'var(--text-primary)'}}>PID:</strong> {cpuState.running_process.pid}</div>
                <div><strong style={{color: 'var(--text-primary)'}}>Nombre:</strong> {cpuState.running_process.name}</div>
                <div><strong style={{color: 'var(--text-primary)'}}>Tiempo restante:</strong> {cpuState.running_process.remaining_time} u</div>
                <div><strong style={{color: 'var(--text-primary)'}}>Prioridad:</strong> {cpuState.running_process.priority}</div>
              </div>
            </div>
          ) : (
            <div style={{ 
              padding: 15,
              background: 'var(--gantt-bg)',
              borderRadius: 2,
              textAlign: 'center',
              color: 'var(--text-secondary)',
              border: '1px dashed var(--border-color)',
              fontSize: 13
            }}>
              CPU en estado IDLE - No hay procesos en ejecución
            </div>
          )}
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-primary)',
          padding: 20,
          borderRadius: 4,
          marginBottom: 20,
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <div style={{fontSize: 14, color: 'var(--text-secondary)'}}>
            Cargando estado del CPU...
          </div>
        </div>
      )}

      {/* Configuración y Controles */}
      <div style={{ 
        background: 'var(--bg-primary)',
        padding: 20,
        borderRadius: 4,
        marginBottom: 20,
        border: '1px solid var(--border-color)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{marginTop: 0, marginBottom: 16, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)'}}>
          Control de Planificación Manual
        </h3>
        
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 15,
          marginBottom: 15
        }}>
          <div>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '13px', color: 'var(--text-primary)'}}>
              Algoritmo
            </label>
            <select 
              value={algorithm} 
              onChange={e => setAlgorithm(e.target.value)}
              disabled={isRunning}
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: 2,
                border: '1px solid var(--border-color)',
                fontSize: 13,
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                transition: 'border-color 0.15s'
              }}
            >
              <option value="FCFS">FCFS</option>
              <option value="SJF">SJF</option>
              <option value="RR">Round Robin</option>
              <option value="PRIORITY">Prioridades</option>
            </select>
          </div>

          {algorithm === "RR" && (
            <div>
              <label style={{display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '13px', color: 'var(--text-primary)'}}>
                Quantum
              </label>
              <input 
                type="number" 
                min="1"
                max="10"
                value={quantum} 
                onChange={e => setQuantum(parseInt(e.target.value))}
                disabled={isRunning}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: 2,
                  border: '1px solid var(--border-color)',
                  fontSize: 13,
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  transition: 'border-color 0.15s'
                }}
              />
            </div>
          )}

          <div>
            <label style={{display: 'block', marginBottom: 6, fontWeight: 500, fontSize: '13px', color: 'var(--text-primary)'}}>
              Velocidad (ms)
            </label>
            <input 
              type="range"
              min="500"
              max="3000"
              step="500"
              value={simulationSpeed}
              onChange={e => setSimulationSpeed(parseInt(e.target.value))}
              disabled={isRunning}
              style={{ width: '100%' }}
            />
            <div style={{textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', marginTop: 4}}>
              {simulationSpeed}ms
            </div>
          </div>
        </div>

        <div style={{
          padding: 12,
          background: 'rgba(255, 193, 7, 0.1)',
          borderRadius: 2,
          marginBottom: 15,
          border: '1px solid rgba(255, 193, 7, 0.3)',
          fontSize: 12,
          color: '#f57f17'
        }}>
          <strong>⚠️ Nota:</strong> Estos controles son para ejecución manual. El algoritmo mostrado arriba es el que se ejecutó en la simulación.
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button 
            onClick={scheduleCPU}
            disabled={isRunning}
            style={{
              padding: '10px 16px',
              background: isRunning ? '#d0d0d0' : 'var(--accent)',
              color: isRunning ? '#808080' : 'white',
              border: 'none',
              borderRadius: 2,
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              fontSize: 13,
              transition: 'background-color 0.15s'
            }}
          >
            Ejecutar 1 Paso ({algorithm})
          </button>

          {!isRunning ? (
            <button 
              onClick={startScheduling}
              style={{
                padding: '10px 16px',
                background: '#107C10',
                color: 'white',
                border: 'none',
                borderRadius: 2,
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: 13,
                transition: 'background-color 0.15s'
              }}
            >
              Iniciar Auto-Ejecución
            </button>
          ) : (
            <button 
              onClick={stopScheduling}
              style={{
                padding: '10px 16px',
                background: '#A4262C',
                color: 'white',
                border: 'none',
                borderRadius: 2,
                cursor: 'pointer',
                fontWeight: 500,
                fontSize: 13,
                transition: 'background-color 0.15s'
              }}
            >
              Detener
            </button>
          )}

          <button 
            onClick={createNewProcess}
            style={{
              padding: '10px 16px',
              background: '#ffc107',
              color: '#333',
              border: 'none',
              borderRadius: 2,
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: 13,
              transition: 'background-color 0.15s'
            }}
          >
            Crear Proceso
          </button>
        </div>
      </div>

      {/* Tabla de Procesos */}
      <div style={{
        background: 'var(--bg-primary)',
        padding: 20,
        borderRadius: 4,
        marginBottom: 20,
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{marginTop: 0, marginBottom: 16, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)'}}>
          Lista de Procesos ({processes.length})
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--gantt-bg)', borderBottom: '1px solid var(--border-color)' }}>
                <th style={{padding: 10, textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)'}}>PID</th>
                <th style={{padding: 10, textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)'}}>Nombre</th>
                <th style={{padding: 10, textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)'}}>Estado</th>
                <th style={{padding: 10, textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)'}}>Prioridad</th>
                <th style={{padding: 10, textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)'}}>Burst</th>
                <th style={{padding: 10, textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)'}}>Restante</th>
                <th style={{padding: 10, textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)'}}>Espera</th>
              </tr>
            </thead>
            <tbody>
              {processes.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{padding: 20, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13}}>
                    No hay procesos
                  </td>
                </tr>
              ) : (
                processes.map(proc => (
                  <tr 
                    key={proc.pid}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      background: proc.state === 'RUNNING' ? 'rgba(13, 71, 161, 0.05)' : 'transparent',
                      fontSize: 12,
                      color: 'var(--text-primary)'
                    }}
                  >
                    <td style={{padding: 10, fontWeight: 600}}>{proc.pid}</td>
                    <td style={{padding: 10}}>{proc.name}</td>
                    <td style={{padding: 10, textAlign: 'center'}}>
                      <span style={{
                        padding: '3px 8px',
                        borderRadius: 2,
                        background: getStateColor(proc.state),
                        color: 'white',
                        fontSize: 11,
                        fontWeight: 500,
                        display: 'inline-block'
                      }}>
                        {getStateBadge(proc.state)}
                      </span>
                    </td>
                    <td style={{padding: 10, textAlign: 'center'}}>
                      <span style={{
                        padding: '3px 6px',
                        borderRadius: 2,
                        background: proc.priority <= 3 ? '#A4262C' : proc.priority <= 7 ? '#ffc107' : '#107C10',
                        color: proc.priority <= 7 && proc.priority > 3 ? '#333' : 'white',
                        fontSize: 11,
                        fontWeight: 600
                      }}>
                        {proc.priority}
                      </span>
                    </td>
                    <td style={{padding: 10, textAlign: 'center'}}>{proc.burst_time || 0}</td>
                    <td style={{padding: 10, textAlign: 'center', fontWeight: 600, color: proc.remaining_time === 0 ? '#107C10' : 'var(--accent)'}} >
                      {proc.remaining_time || 0}
                    </td>
                    <td style={{padding: 10, textAlign: 'center'}}>{proc.waiting_time || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Métricas de Rendimiento */}
      {metrics && (
        <div style={{ 
          background: 'var(--bg-primary)',
          padding: 20,
          borderRadius: 4,
          marginBottom: 20,
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{marginTop: 0, marginBottom: 16, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)'}}>
            Métricas de Rendimiento
          </h3>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 16
          }}>
            <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
              <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>Tiempo Espera</div>
              <div style={{fontSize: 24, fontWeight: 'bold', color: 'var(--accent)'}}>
                {metrics.avg_waiting_time?.toFixed(2) || 0}
              </div>
              <div style={{fontSize: 11, color: 'var(--text-secondary)', marginTop: 4}}>u</div>
            </div>
            <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
              <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>Tiempo Retorno</div>
              <div style={{fontSize: 24, fontWeight: 'bold', color: 'var(--accent)'}}>
                {metrics.avg_turnaround_time?.toFixed(2) || 0}
              </div>
              <div style={{fontSize: 11, color: 'var(--text-secondary)', marginTop: 4}}>u</div>
            </div>
            <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
              <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>Tiempo Respuesta</div>
              <div style={{fontSize: 24, fontWeight: 'bold', color: 'var(--accent)'}}>
                {metrics.avg_response_time?.toFixed(2) || 0}
              </div>
              <div style={{fontSize: 11, color: 'var(--text-secondary)', marginTop: 4}}>u</div>
            </div>
            <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
              <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>Throughput</div>
              <div style={{fontSize: 24, fontWeight: 'bold', color: 'var(--accent)'}}>
                {metrics.throughput || 0}
              </div>
              <div style={{fontSize: 11, color: 'var(--text-secondary)', marginTop: 4}}>procesos</div>
            </div>
            <div style={{background: 'var(--gantt-bg)', padding: 12, borderRadius: 2, border: '1px solid var(--border-color)', textAlign: 'center'}}>
              <div style={{fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6}}>Context Switches</div>
              <div style={{fontSize: 24, fontWeight: 'bold', color: 'var(--accent)'}}>
                {metrics.total_context_switches || 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Log de Ejecución */}
      {executionLog.length > 0 && (
        <div style={{
          background: 'var(--bg-primary)',
          padding: 20,
          borderRadius: 4,
          border: '1px solid var(--border-color)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 15
          }}>
            <h3 style={{margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)'}}>
              Log de Ejecución
            </h3>
            <button 
              onClick={() => setExecutionLog([])}
              style={{
                padding: '6px 12px',
                background: '#A4262C',
                color: 'white',
                border: 'none',
                borderRadius: 2,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                transition: 'background-color 0.15s'
              }}
            >
              Limpiar
            </button>
          </div>
          <div style={{
            maxHeight: 300,
            overflowY: 'auto',
            background: 'var(--gantt-bg)',
            padding: 10,
            borderRadius: 2,
            fontSize: 12,
            fontFamily: 'monospace',
            border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)'
          }}>
            {executionLog.map((log, idx) => (
              <div key={idx} style={{
                padding: 8,
                borderBottom: '1px solid var(--border-color)',
                background: idx % 2 === 0 ? 'var(--bg-primary)' : 'transparent'
              }}>
                <strong style={{color: 'var(--accent)'}}>[{log.time}]</strong> {log.action}
                <div style={{color: 'var(--text-secondary)', fontSize: 11, marginTop: 2}}>{log.details}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}