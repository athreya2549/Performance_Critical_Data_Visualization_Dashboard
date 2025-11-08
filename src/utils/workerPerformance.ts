interface WorkerPerformanceEvent {
  type: 'performance';
  data: {
    operation: string;
    duration: number;
  };
}

interface WorkerErrorEvent {
  type: 'error';
  error: string;
}

type WorkerEvent = WorkerPerformanceEvent | WorkerErrorEvent;

const workers = new Set<Worker>();
const timings = new Map<string, number[]>();

export function trackWorkerPerformance(worker: Worker) {
  workers.add(worker);

  worker.addEventListener('message', (e: MessageEvent<WorkerEvent>) => {
    if (e.data.type === 'performance') {
      const { operation, duration } = e.data.data;
      if (!timings.has(operation)) {
        timings.set(operation, []);
      }
      timings.get(operation)?.push(duration);
    }
  });

  return {
    getAverageTime: (operation: string): number | undefined => {
      const times = timings.get(operation);
      if (!times?.length) return undefined;
      return times.reduce((a, b) => a + b, 0) / times.length;
    },
    clearTimings: () => {
      timings.clear();
    },
    cleanup: () => {
      workers.delete(worker);
    }
  };
}