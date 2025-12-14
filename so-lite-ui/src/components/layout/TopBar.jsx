import React, { useContext } from "react";
import { SimulatorContext } from "../../context/SimulatorContext";

export default function TopBar(){
  const { running, setRunning } = useContext(SimulatorContext);
  return (
    <div className="topbar">
      <div className="controls">
        <button onClick={()=>setRunning(true)}>PLAY</button>
        <button onClick={()=>setRunning(false)}>PAUSA</button>
        <button onClick={()=>window.location.reload()}>RESET</button>
        <label style={{display:"flex",alignItems:"center",gap:8}}>
          Velocidad
          <input type="range" min="1" max="10" defaultValue="5" />
        </label>
      </div>
      <div className="time">TIEMPO <strong>15:00</strong></div>
    </div>
  );
}
