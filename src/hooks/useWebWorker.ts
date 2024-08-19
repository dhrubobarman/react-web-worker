import { useState, useEffect, useCallback } from "react";

type WorkerStatus = "idle" | "running" | "error";

function useWebWorker<T extends (...args: Parameters<T>) => ReturnType<T>>(
  workerFunction: T
): [
  (...args: Parameters<T>) => Promise<ReturnType<T>>,
  { status: WorkerStatus; kill: () => void }
] {
  const [status, setStatus] = useState<WorkerStatus>("idle");
  const [worker, setWorker] = useState<Worker | null>(null);

  useEffect(() => {
    const workerFunc = () => {
      self.onmessage = async (event) => {
        const { input, functionString } = event.data;
        const func = new Function("return " + functionString)();
        try {
          const result = await func(...input);
          self.postMessage({ result });
        } catch (error) {
          const e = error as ErrorEvent;
          self.postMessage({ error: e.message });
        }
      };
    };
    const code = workerFunc.toString();
    const blob = new Blob([`(${code})()`], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(blob);
    const newWorker = new Worker(workerUrl);
    setWorker(newWorker);

    return () => {
      newWorker.terminate();
      URL.revokeObjectURL(workerUrl);
    };
  }, []);

  const runWorker = useCallback(
    (...args: Parameters<T>): Promise<ReturnType<T>> => {
      if (!worker) {
        return Promise.reject(new Error("Worker not initialized"));
      }
      setStatus("running");
      return new Promise((resolve, reject) => {
        worker!.onmessage = (event) => {
          const { result, error } = event.data;
          if (error) {
            setStatus("error");
            reject(new Error(error));
          } else {
            setStatus("idle");
            resolve(result);
          }
        };

        worker!.onerror = (error) => {
          setStatus("error");
          reject(error);
        };

        worker!.postMessage({
          input: [...args],
          functionString: workerFunction.toString(),
        });
      });
    },
    [worker, workerFunction]
  );

  const kill = useCallback(() => {
    if (worker) {
      worker.terminate();
      setWorker(null);
      setStatus("idle");
    }
  }, [worker]);

  return [runWorker, { status, kill }];
}

export default useWebWorker;

export const webWorkerFunctionCreator = <
  R,
  T extends (...args: Parameters<T>) => R
>(
  func: T
) => {
  // Create a worker function string
  const workerFunction = () => {
    onmessage = (e: MessageEvent) => {
      const { funcString, args } = e.data;
      const func = new Function(`return (${funcString})`)();
      const result = func(...args);
      postMessage(result);
    };
  };

  // Convert the worker function to a string
  const code = workerFunction.toString();
  const blob = new Blob([`(${code})()`], { type: "application/javascript" });
  const workerScript = URL.createObjectURL(blob);
  const worker = new Worker(workerScript);

  return {
    postMessage: (args: Parameters<T>) => {
      worker.postMessage({ funcString: func.toString(), args });
    },
    terminate: () => {
      URL.revokeObjectURL(workerScript);
      worker.terminate();
    },
    onMessage: (callback: (result: R) => void) => {
      worker.onmessage = (e: MessageEvent) => callback(e.data);
    },
  };
};

export function generateWebWorker<
  T extends (...args: Parameters<T>) => ReturnType<T>
>(
  workerFunction: T
): [
  (...args: Parameters<T>) => Promise<ReturnType<T>>,
  { status: WorkerStatus; kill: () => void }
] {
  let status: WorkerStatus = "idle";
  let worker: Worker | null = null;

  const workerFunc = () => {
    self.onmessage = async (event) => {
      const { input, functionString } = event.data;
      const func = new Function("return " + functionString)();
      try {
        const result = await func(...input);
        self.postMessage({ result });
      } catch (error) {
        const e = error as ErrorEvent;
        self.postMessage({ error: e.message });
      }
    };
  };
  const code = workerFunc.toString();
  const blob = new Blob([`(${code})()`], { type: "application/javascript" });
  const workerUrl = URL.createObjectURL(blob);
  const newWorker = new Worker(workerUrl);
  worker = newWorker;

  const runWorker = (...args: Parameters<T>): Promise<ReturnType<T>> => {
    if (!worker) {
      return Promise.reject(new Error("Worker not initialized"));
    }

    status = "running";
    return new Promise((resolve, reject) => {
      worker!.onmessage = (event) => {
        const { result, error } = event.data;
        if (error) {
          status = "error";
          reject(new Error(error));
        } else {
          status = "idle";
          resolve(result);
        }
      };

      worker!.onerror = (error) => {
        status = "error";
        reject(error);
      };

      worker!.postMessage({
        input: [...args],
        functionString: workerFunction.toString(),
      });
    });
  };

  const kill = () => {
    if (worker) {
      worker.terminate();
      worker = null;
      status = "idle";
    }
  };

  return [runWorker, { status, kill }];
}
