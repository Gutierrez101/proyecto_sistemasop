import React from "react";

export default function Sidebar({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "processes", icon: "🏠", label: "Procesos" },
    { id: "cpu", icon: "⚙️", label: "CPU" },
    { id: "memory", icon: "🧠", label: "Memoria Ram" },
    { id: "io", icon: "📡", label: "Dispositivos E/S" },
  ];

  return (
    <aside className="sidebar">
      <h2>DDMOS</h2>
      <ul>
        {tabs.map(tab => (
          <li
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? "#e6e6e6" : "transparent",
              fontWeight: activeTab === tab.id ? "bold" : "normal",
              cursor: "pointer"
            }}
          >
            {tab.icon} {tab.label}
          </li>
        ))}
      </ul>
    </aside>
  );
}