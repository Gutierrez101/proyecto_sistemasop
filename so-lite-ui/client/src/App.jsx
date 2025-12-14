import React, { useState } from "react";
import Sidebar from "./components/layout/Sidebar";
import AlgorithmForm from "./components/AlgorithmForm";
import GanttChart from "./components/GanttChart";
import StatsPanel from "./components/StatsPanel";
import CPUPanel from "./components/CPUPanel";
import MemoryPanel from "./components/MemoryPanel";
import IOPanel from "./components/IOPanel";
import SystemControls from "./components/controls/SystemControls";
import "./index.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("processes");

  const renderContent = () => {
    switch (activeTab) {
      case "processes":
        return (
          <div className="content-processes">
            {/* Panel de Control del Sistema - Solo en la pestaña de procesos */}
            <div style={{ marginBottom: 20 }}>
              <SystemControls />
            </div>
            
            <div className="content">
              <div className="left-panel">
                <AlgorithmForm />
                {/* Diagrama de Gantt debajo del formulario */}
                <div className="gantt-wrapper">
                  <GanttChart />
                </div>
              </div>
              <div className="right-panel">
                <StatsPanel />
              </div>
            </div>
          </div>
        );
      
      case "cpu":
        return (
          <>
            <div style={{ padding: '0 20px', paddingTop: 20 }}>
              <SystemControls />
            </div>
            <CPUPanel />
          </>
        );
      
      case "memory":
        return (
          <>
            <div style={{ padding: '0 20px', paddingTop: 20 }}>
              <SystemControls />
            </div>
            <MemoryPanel />
          </>
        );
      
      case "io":
        return (
          <>
            <div style={{ padding: '0 20px', paddingTop: 20 }}>
              <SystemControls />
            </div>
            <IOPanel />
          </>
        );
      
      default:
        return <div>Selecciona una pestaña</div>;
    }
  };

  return (
    <div className="app">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main">
        {renderContent()}
      </div>
    </div>
  );
}