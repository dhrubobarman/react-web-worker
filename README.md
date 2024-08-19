# WebWorker + React + TypeScript

## Documentation for the `generateWebWorker` function:

### `generateWebWorker`

Creates a web worker to run a given function in a separate thread, returning a function to execute the worker and an object to manage the worker's status and termination.
```typescript
type WorkerStatus = "idle" | "running" | "error";

function generateWebWorker<
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
```

#### Type Parameters
- `T`: The type of the worker function, which extends a function type with parameters and a return type.

#### Parameters
- `workerFunction: T`
  - A function to be executed in the web worker. It takes parameters of type `Parameters<T>` and returns a result of type `ReturnType<T>`.

#### Returns
- A tuple containing:
  1. `(...args: Parameters<T>) => Promise<ReturnType<T>>`: A function to execute the worker with parameters of type `Parameters<T>`, returning a `Promise` that resolves to the result of type `ReturnType<T>`.
  2. `{ status: WorkerStatus; kill: () => void }`: An object with:
     - `status: WorkerStatus`: The current status of the worker (`"idle"`, `"running"`, or `"error"`).
     - `kill: () => void`: A function to terminate the worker.

#### Example Usage
```typescript
// src/App.tsx
import { useState } from "react";
import { generateWebWorker } from "./hooks/useWebWorker";

const workerFunc = (num = 10000) => {
  if (!num) return 0;
  let result = 0;
  for (let i = 0; i < Math.abs(+num); i++) {
    result += i;
  }
  return result;
};
const [runWorker] = generateWebWorker(workerFunc);

const App = () => {
  const [input, setInput] = useState<number>(0);
  const [result, setResult] = useState<number | null>(null);

  const handleChange = async (value: number) => {
    setInput(value);
    try {
      const result = await runWorker(value);
      setResult(result);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      <label>
        <input
          type="number"
          value={input}
          onChange={(e) => handleChange(e.target.valueAsNumber)}
        />
      </label>
      <button
        onClick={() => handleChange(200000000 + input)}
      >
        Increse Value by 200M
      </button>
      <div>Result: {result}</div>
    </div>
  );
};

export default App;
```

#### Detailed Description
1. **Worker Initialization**: The `workerFunc` function defines the worker's behavior, listening for messages, executing the provided function, and posting the result or error back to the main thread. This function is converted to a string and used to create a `Blob`, which is then used to create a `Worker`.
2. **Running the Worker**: The `runWorker` function sets the worker status to `"running"` and returns a `Promise` that resolves with the result or rejects with an error. It posts a message to the worker with the function's parameters and string representation.
3. **Terminating the Worker**: The `kill` function terminates the worker and resets its status to `"idle"`.

This function is useful for offloading CPU-intensive tasks to a background thread, freeing up the main thread for other operations.

---
---

## Here's the documentation for the `useWebWorker` hook:

### `useWebWorker`

A custom React hook that creates a web worker to run a given function in a separate thread, returning a function to execute the worker and an object to manage the worker's status and termination.

```typescript
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
```

#### Type Parameters
- `T`: The type of the worker function, which extends a function type with parameters and a return type.

#### Parameters
- `workerFunction: T`
  - A function to be executed in the web worker. It takes parameters of type `Parameters<T>` and returns a result of type `ReturnType<T>`.

#### Returns
- A tuple containing:
  1. `(...args: Parameters<T>) => Promise<ReturnType<T>>`: A function to execute the worker with parameters of type `Parameters<T>`, returning a `Promise` that resolves to the result of type `ReturnType<T>`.
  2. `{ status: WorkerStatus; kill: () => void }`: An object with:
     - `status: WorkerStatus`: The current status of the worker (`"idle"`, `"running"`, or `"error"`).
     - `kill: () => void`: A function to terminate the worker.

#### Example Usage
```typescript
// src/App.tsx
import React, { useState } from 'react';
import useWebWorker from './useWebWorker';

const workerFunction = (input?: number) => {
  return input ? input * 2 : 0; // Example computation
};

const App: React.FC = () => {
  const [input, setInput] = useState<number>(0);
  const [runWorker, { status, kill }] = useWebWorker(workerFunction);

  const handleRun = async () => {
    try {
      const result = await runWorker(input);
      console.log('Result:', result);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <input
        type="number"
        value={input}
        onChange={(e) => setInput(Number(e.target.value))}
      />
      <button onClick={handleRun}>Run Worker</button>
      <button onClick={kill}>Kill Worker</button>
      <div>Status: {status}</div>
    </div>
  );
};

export default App;
```

#### Detailed Description
1. **Worker Initialization**: The `useEffect` hook initializes the web worker when the component mounts. It creates a worker script that listens for messages, executes the provided function, and posts the result or error back to the main thread. The worker is terminated and the URL is revoked when the component unmounts.
2. **Running the Worker**: The `runWorker` function, created using `useCallback`, sets the worker status to `"running"` and returns a `Promise` that resolves with the result or rejects with an error. It posts a message to the worker with the function's parameters and string representation.
3. **Terminating the Worker**: The `kill` function, also created using `useCallback`, terminates the worker and resets its status to `"idle"`.

This hook is useful for offloading CPU-intensive tasks to a background thread, freeing up the main thread for other operations in a React application.
