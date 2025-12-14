import React from "react";
import Sidebar from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import AlgorithmForm from "./components/AlgorithmForm";
import GanttChart from "./components/GanttChart";
import StatsPanel from "./components/StatsPanel";
import "./index.css";

export default function App() {
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <TopBar />
        <div className="content">
          <div className="left-panel">
            <AlgorithmForm />
            <div className="gantt-wrapper">
              <GanttChart />
            </div>
          </div>
          <div className="right-panel">
            <StatsPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
