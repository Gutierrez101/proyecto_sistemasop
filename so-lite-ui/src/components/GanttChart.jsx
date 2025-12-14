import React, { useContext } from "react";
import { SimulatorContext } from "../context/SimulatorContext";

/**
 * Render simple Gantt:
 * - left column: pid labels
 * - right: timeline grid (units = 1)
 *
 * We compute time range from timeline.
 */
export default function GanttChart(){
  const { timeline } = useContext(SimulatorContext);

  // get unique pids in timeline order
  const pids = Array.from(new Set(timeline.map(t => t.pid)));
  const endTime = timeline.reduce((m,t)=>Math.max(m, t.start + t.duration), 0);
  
  // Calcular escala dinámica para que quepa en el contenedor (máx 600px de ancho útil)
  const maxWidth = 600;
  const contentWidth = (endTime + 2) * 40; // ancho natural con escala 40
  const scale = Math.min(40, (maxWidth / (endTime + 2)));

  return (
    <div className="gantt-card">
      <div style={{fontWeight:600, marginBottom:12, fontSize: '14px'}}>Diagrama de Gantt</div>
      <div className="gantt-area">
        <div className="gantt-left">
          {pids.length === 0 ? (
            Array.from({length:8}).map((_,i)=>(
              <div className="gantt-row" key={i} style={{height:28, paddingLeft:8}}>Task {String(i+1).padStart(2,"0")}</div>
            ))
          ) : pids.map(pid=>(
            <div className="gantt-row" key={pid} style={{height:28, paddingLeft:8}}>{pid}</div>
          ))}
        </div>

        <div className="gantt-grid" style={{width:"100%", maxWidth:"100%", position:"relative"}}>
          {/* vertical time lines */}
          <div style={{position:"absolute",left:0,top:0,bottom:0,right:0}}>
            {Array.from({length: endTime+2}).map((_,i)=>(
              <div key={i} style={{
                position:"absolute",
                left:i*scale,
                top:0,
                bottom:0,
                width:1,
                background:"rgba(0,0,0,0.06)"
              }} />
            ))}
          </div>

          {/* rows with bars */}
          {pids.map((pid, rowIdx)=>(
            <div key={pid} className="gantt-row" style={{height:28}}>
              {/* bars for this pid */}
              {timeline.filter(t=>t.pid===pid).map((t,i)=>(
                <div
                  key={i}
                  className={"gantt-bar " + (t.duration<=1 ? "small": "")}
                  style={{
                    left: t.start*scale + "px",
                    width: t.duration*scale + "px",
                    top: 5 + rowIdx*28 + "px",
                    background: t.color || undefined
                  }}
                >
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
