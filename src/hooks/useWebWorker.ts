import { useCallback, useEffect, useState } from "react";

const useWebWorker = <T>(
  inputData: T,
  workerFunction: () => void,
  shouldExecute: boolean | number = true
) => {
  const [result, setResult] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const memoizedWorkerFunction = useCallback(workerFunction, [workerFunction]);

  useEffect(() => {
    setIsLoading(Boolean(shouldExecute));
    if (!shouldExecute) return;
    setError(null);
    try {
      const code = memoizedWorkerFunction.toString();
      const blob = new Blob([`(${code})()`], {
        type: "application/javascript",
      });
      const workerScript = URL.createObjectURL(blob);
      const worker = new Worker(workerScript);
      worker.postMessage(inputData);
      worker.onmessage = (e) => {
        setResult(e.data);
        setIsLoading(false);
      };
      worker.onerror = (e) => {
        setError(e.message);
        setIsLoading(false);
      };

      return () => {
        worker.terminate();
        URL.revokeObjectURL(workerScript);
      };
    } catch (error) {
      const e = error as ErrorEvent;
      setError(e.message);
    }
  }, [inputData, memoizedWorkerFunction, shouldExecute]);

  return { result, isLoading, error };
};

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
    terminate: () => worker.terminate(),
    onMessage: (callback: (result: R) => void) => {
      worker.onmessage = (e: MessageEvent) => callback(e.data);
    },
  };
};
