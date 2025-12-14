import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

const api = axios.create({ 
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// ============= KERNEL =============
export const initializeKernel = async (config = {}) => {
  const response = await api.post('/kernel/initialize', {
    memory_mode: config.memory_mode || 'paging',
    total_memory: config.total_memory || 1024
  });
  return response.data;
};

// ============= PROCESSES =============
export const createProcess = async (processData) => {
  const response = await api.post('/processes/create', processData);
  return response.data;
};

export const getAllProcesses = async () => {
  const response = await api.get('/processes');
  return response.data;
};

// ============= SIMULATION =============
export const runSimulation = async (simConfig) => {
  const response = await api.post('/simulation/run', {
    algorithm: simConfig.algorithm || 'FCFS',
    time_quantum: simConfig.time_quantum || 4,
    steps: simConfig.steps || 30
  });
  return response.data;
};

// Ejecutar un solo paso del scheduler
export const scheduleStep = async (algorithm, quantum) => {
  const response = await api.post('/cpu/schedule', {
    algorithm: algorithm || 'FCFS',
    time_quantum: quantum || 4
  });
  return response.data;
};

// ============= SYSTEM STATE =============
export const getSystemState = async () => {
  const response = await api.get('/system/state');
  return response.data;
};

export const getMemoryState = async () => {
  const response = await api.get('/memory/state');
  return response.data;
};

export const getIODevices = async () => {
  const response = await api.get('/io/devices');
  return response.data;
};

// ============= HEALTH CHECK =============
export const healthCheck = async () => {
  const response = await api.get('/health');
  return response.data;
};

export default api;