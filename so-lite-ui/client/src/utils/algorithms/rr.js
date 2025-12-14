export function roundRobin(processes, quantum=2){
  const queue = processes.map(p=>({...p, remaining:p.burst}));
  queue.sort((a,b)=>a.arrival - b.arrival);
  const ready = [];
  const timeline = [];
  let t = 0;
  const waitingMap = {};
  const startTimes = {};

  while(queue.length || ready.length){
    while(queue.length && queue[0].arrival <= t) ready.push(queue.shift());
    if(!ready.length){
      if(queue.length) t = queue[0].arrival;
      continue;
    }
    const p = ready.shift();
    const exec = Math.min(quantum, p.remaining);
    timeline.push({ pid: p.pid, start: t, duration: exec });
    if(startTimes[p.pid] === undefined) startTimes[p.pid] = t;
    p.remaining -= exec;
    t += exec;
    while(queue.length && queue[0].arrival <= t) ready.push(queue.shift());
    if(p.remaining > 0) ready.push(p);
    else {
      // calculate waiting & turnaround
      const turnaround = t - p.arrival;
      const waiting = turnaround - p.burst;
      waitingMap[p.pid] = { waiting, turnaround };
    }
  }

  const statsArr = Object.values(waitingMap);
  const waitingAvg = (statsArr.reduce((s,a)=>s+a.waiting,0) / statsArr.length) || 0;
  const turnaroundAvg = (statsArr.reduce((s,a)=>s+a.turnaround,0)/statsArr.length) || 0;

  return { timeline, stats:{ waitingAvg, turnaroundAvg } };
}
