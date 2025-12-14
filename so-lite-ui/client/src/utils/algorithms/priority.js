export function priority(processes){
  const procs = processes.map(p=>({...p}));
  let time=0;
  const timeline=[];
  const done = new Set();
  const n = procs.length;
  const stats = { waiting:[], turnaround:[] };

  while(done.size < n){
    const available = procs.filter(p=>p.arrival <= time && !done.has(p.pid));
    if(available.length === 0){
      time = Math.min(...procs.filter(p=>!done.has(p.pid)).map(p=>p.arrival));
      continue;
    }
    available.sort((a,b)=>a.priority - b.priority); // menor número -> mayor prioridad
    const p = available[0];
    timeline.push({ pid: p.pid, start: time, duration: p.burst });
    const waiting = time - p.arrival;
    time += p.burst;
    const turnaround = time - p.arrival;
    stats.waiting.push(waiting);
    stats.turnaround.push(turnaround);
    done.add(p.pid);
  }

  const waitingAvg = stats.waiting.reduce((a,b)=>a+b,0)/n || 0;
  const turnaroundAvg = stats.turnaround.reduce((a,b)=>a+b,0)/n || 0;
  return { timeline, stats:{ waitingAvg, turnaroundAvg } };
}
