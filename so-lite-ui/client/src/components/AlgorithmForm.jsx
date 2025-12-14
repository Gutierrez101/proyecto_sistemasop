import React, { useContext, useState, useEffect } from "react";
import { SimulatorContext } from "../context/SimulatorContext";
import { 
  initializeKernel, 
  createProcess, 
  runSimulation,
  healthCheck 
} from "../api/apiClient";

export default function AlgorithmForm() {
  // Agregamos 'timeline' para poder dibujarlo
  const { timeline, setTimeline, setStats } = useContext(SimulatorContext);
  
  const [algorithm, setAlgorithm] = useState("fcfs");
  const [quantum, setQuantum] = useState(3);
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    checkAPIConnection();
  }, []);

  const checkAPIConnection = async () => {
    try {
      await healthCheck();
      setApiStatus('connected');
    } catch (error) {
      setApiStatus('error');
      console.error('Error conectando con el backend:', error);
    }
  };

  const initializeSystem = async () => {
    setLoading(true);
    try {
      setTimeline([]);
      setStats({
        waitingAvg: 0,
        turnaroundAvg: 0,
        responseAvg: 0,
        throughput: 0,
        contextSwitches: 0
      });

      await initializeKernel({
        memory_mode: 'paging',
        total_memory: 1024
      });

      const sampleProcesses = [
        { name: "P1", priority: 2, burst_time: 8, memory_required: 50 },
        { name: "P2", priority: 1, burst_time: 12, memory_required: 80 },
        { name: "P3", priority: 3, burst_time: 6, memory_required: 30 },
        { name: "P4", priority: 2, burst_time: 10, memory_required: 60 },
      ];

      for (const proc of sampleProcesses) {
        await createProcess(proc);
      }

      setIsInitialized(true);
      alert('Sistema inicializado correctamente con 4 procesos');
    } catch (error) {
      console.error('Error inicializando:', error);
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const runAlgorithm = async () => {
    if (!isInitialized) {
      alert('Primero debes inicializar el sistema');
      return;
    }

    setLoading(true);
    try {
      const algorithmMap = {
        'fcfs': 'FCFS',
        'sjf': 'SJF',
        'rr': 'RR',
        'priority': 'PRIORITY'
      };

      // Enviamos la petición
      const result = await runSimulation({
        algorithm: algorithmMap[algorithm] || 'FCFS',
        time_quantum: Number(quantum),
        steps: 40
      });

      console.log('Resultado:', result);

      if (result.timeline && result.timeline.length > 0) {
        setTimeline(result.timeline);
      } else {
        setTimeline([]);
      }

      const cpuMetrics = result.metrics?.cpu || {};
      const newStats = {
        waitingAvg: cpuMetrics.avg_waiting_time || 0,
        turnaroundAvg: cpuMetrics.avg_turnaround_time || 0,
        responseAvg: cpuMetrics.avg_response_time || 0,
        throughput: cpuMetrics.throughput || 0,
        contextSwitches: cpuMetrics.total_context_switches || 0
      };

      setStats(newStats);

      alert(`Simulación completada con ${algorithmMap[algorithm]}`);

    } catch (error) {
      console.error('Error ejecutando simulación:', error);
      alert('Error: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const resetSystem = async () => {
    if (confirm('¿Deseas reiniciar el sistema?')) {
      setIsInitialized(false);
      setTimeline([]);
      setStats({ waitingAvg: 0, turnaroundAvg: 0, responseAvg: 0, throughput: 0, contextSwitches: 0 });
    }
  };

  // Función simple para dar color a los procesos
  const getColor = (name) => {
    const colors = { 'P1': '#ff6b6b', 'P2': '#4ecdc4', 'P3': '#ffe66d', 'P4': '#1a535c' };
    return colors[name] || '#ccc';
  };

  return (
    <div className="form-card">
      <h3>Sistema Operativo - Simulador</h3>
      
      <div style={{
        marginBottom: 16, padding: 12, borderRadius: 2,
        background: apiStatus === 'connected' ? '#e8f5e9' : '#ffebee', 
        border: `1px solid ${apiStatus === 'connected' ? '#4caf50' : '#f44336'}`
      }}>
        <strong style={{fontSize: '13px', color: apiStatus === 'connected' ? '#2e7d32' : '#c62828'}}>
          {apiStatus === 'connected' ? 'API Conectada' : 'API Desconectada'}
        </strong>
      </div>

      {!isInitialized ? (
        <button 
          className="start-btn" 
          onClick={initializeSystem} 
          disabled={loading || apiStatus !== 'connected'}
          style={{ background: apiStatus === 'connected' ? 'var(--btn)' : '#c0c0c0', marginBottom: 12 }}
        >
          {loading ? 'Inicializando...' : 'Inicializar Sistema'}
        </button>
      ) : (
        <>
          <div className="form-row">
            <label>Algoritmo</label>
            <select className="select" value={algorithm} onChange={e=>setAlgorithm(e.target.value)} disabled={loading}>
              <option value="fcfs">FCFS</option>
              <option value="sjf">SJF (Shortest Job First)</option>
              <option value="rr">Round Robin</option>
              <option value="priority">Prioridades</option>
            </select>
          </div>

          {algorithm === 'rr' && (
            <div className="form-row">
              <label>Quantum</label>
              <input type="number" min="1" max="10" value={quantum} onChange={e=>setQuantum(e.target.value)} disabled={loading} />
            </div>
          )}

          <div style={{display: 'flex', gap: 10, marginBottom: 20}}>
            <button className="start-btn" onClick={runAlgorithm} disabled={loading} style={{flex: 1}}>
              {loading ? 'Ejecutando...' : 'Simular'}
            </button>
            <button onClick={resetSystem} disabled={loading} style={{background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: 2, padding: '10px 14px', cursor: 'pointer', fontWeight: 500, fontSize: '13px', transition: 'background-color 0.15s'}}>
              Reiniciar
            </button>
          </div>

          {/* === DIAGRAMA DE GANTT RESPONSIVO Y AL FINAL === */}
          {timeline && timeline.length > 0 && (
            <div style={{ borderTop: '2px solid #eee', paddingTop: '15px' }}>
              <h4>📊 Diagrama de Gantt</h4>
              
              {/* Contenedor con scroll horizontal */}
              <div style={{
                display: 'flex',
                overflowX: 'auto',     // Scroll si se desborda
                maxWidth: '100%',      // No romper la pantalla
                padding: '10px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #ddd',
                whiteSpace: 'nowrap'   // Bloques en una sola línea
              }}>
                {timeline.map((block, idx) => (
                  <div key={idx} style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', marginRight: 2
                  }}>
                    <div style={{
                      width: '30px', 
                      height: '40px', 
                      background: getColor(block.pid),
                      color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '10px', fontWeight: 'bold',
                      border: '1px solid #fff'
                    }}>
                      {block.pid}
                    </div>
                    <span style={{fontSize: 9, color: '#666'}}>{idx+1}</span>
                  </div>
                ))}
              </div>
              <small>Desliza ➡️ para ver todo</small>
            </div>
          )}
        </>
      )}
    </div>
  );
}