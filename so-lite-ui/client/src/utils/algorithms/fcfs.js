export function fcfs(processes){
  const procs = processes.map(p=>({...p, remaining:p.burst}));
  procs.sort((a,b)=>a.arrival - b.arrival);
  let time=0;
  const timeline=[];
  const stats = { waiting:[], turnaround:[] };

  procs.forEach(p=>{
    if(time < p.arrival) time = p.arrival;
    timeline.push({ pid: p.pid, start: time, duration: p.burst });
    const waiting = time - p.arrival;
    time += p.burst;
    const turnaround = time - p.arrival;
    stats.waiting.push(waiting);
    stats.turnaround.push(turnaround);
  });

  const waitingAvg = stats.waiting.reduce((a,b)=>a+b,0)/stats.waiting.length || 0;
  const turnaroundAvg = stats.turnaround.reduce((a,b)=>a+b,0)/stats.turnaround.length || 0;

  return { timeline, stats: { waitingAvg, turnaroundAvg } };
}
