# WebWorker + React + TypeScript

### Description of `webWorkerFunctionCreator` Function

The `webWorkerFunctionCreator` function is a utility designed to create and manage Web Workers in a TypeScript environment. It allows you to offload computationally intensive tasks to a separate thread, thereby keeping the main thread responsive. Here's a detailed breakdown of its components and functionality:

```typescript
const webWorkerFunctionCreator = <
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
```

1. **Generics**:
   - `<R, T extends (...args: Parameters<T>) => R>`: The function uses generics to ensure type safety. `R` represents the return type of the function, and `T` represents the function type that will be executed in the Web Worker.

2. **Function Parameter**:
   - `func: T`: The function to be executed in the Web Worker is passed as an argument.

3. **Worker Function**:
   - The `workerFunction` is defined to handle messages from the main thread. It reconstructs the function from a string, executes it with the provided arguments, and posts the result back to the main thread.

4. **Blob and Worker Script**:
   - The `workerFunction` is converted to a string and wrapped in a `Blob` object. This blob is then used to create a URL, which serves as the script for the Web Worker.

5. **Worker Creation**:
   - A new `Worker` instance is created using the generated script URL.

6. **Return Object**:
   - The function returns an object with the following methods:
     - **postMessage**: Sends data to the worker. It serializes the function and its arguments and posts them to the worker.
     - **terminate**: Terminates the worker, stopping its execution and the URL is revoked.
     - **onMessage**: Sets a callback to handle messages from the worker. This callback receives the result of the function executed in the worker.

### Usage Example

Here's how you can use the `webWorkerFunctionCreator` in a React component:

```typescript
// src/App.tsx
import React, { useState, useEffect } from 'react';
import { webWorkerFunctionCreator } from './webWorkerFunctionCreator';

const App: React.FC = () => {
  const [input, setInput] = useState<number>(0);
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    const worker = webWorkerFunctionCreator<number, (num: number) => number>(
      (num) => num * 2
    );

    worker.onMessage((res) => {
      setResult(res);
    });

    worker.postMessage([input]);

    return () => {
      worker.terminate();
    };
  }, [input]);

  return (
    <div>
      <input
        type="number"
        value={input}
        onChange={(e) => setInput(Number(e.target.value))}
      />
      <div>Result: {result}</div>
    </div>
  );
};

export default App;
```

This setup ensures that the function is executed in a separate thread, keeping the main thread free for UI updates and other tasks.

---

### Documentation for `useWebWorker` Hook

The `useWebWorker` hook is a custom React hook designed to execute a function in a Web Worker, providing a way to offload heavy computations to a separate thread. This helps keep the main thread responsive and improves the performance of your application. Here's a detailed breakdown of its components and functionality:

```typescript
function useWebWorker<T, R>(
  workerFunction: (input?: T) => R
): [(input?: T) => Promise<R>, { status: WorkerStatus; kill: () => void }] {
  const [status, setStatus] = useState<WorkerStatus>("idle");
  const [worker, setWorker] = useState<Worker | null>(null);

  useEffect(() => {
    const workerFunction = () => {
      self.onmessage = async (event) => {
        const { input, functionString } = event.data;
        const func = new Function("return " + functionString)();
        try {
          const result = await func(input);
          self.postMessage({ result });
        } catch (error) {
          const e = error as ErrorEvent;
          self.postMessage({ error: e.message });
        }
      };
    };
    const code = workerFunction.toString();
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
    (input?: T): Promise<R> => {
      if (!worker) {
        return Promise.reject(new Error("Worker not initialized"));
      }

      setStatus("running");
      return new Promise((resolve, reject) => {
        worker.onmessage = (event) => {
          const { result, error } = event.data;
          if (error) {
            setStatus("error");
            reject(new Error(error));
          } else {
            setStatus("idle");
            resolve(result);
          }
        };

        worker.onerror = (error) => {
          setStatus("error");
          reject(error);
        };

        worker.postMessage({
          input,
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
- `<T, R>`: 
  - `T`: The type of the input data to the worker function.
  - `R`: The type of the result returned by the worker function.

#### Parameters
- `workerFunction: (input?: T) => R`: 
  - The function to be executed in the Web Worker. This function takes an optional input of type `T` and returns a result of type `R`.

#### Return Value
- `[(input?: T) => Promise<R>, { status: WorkerStatus; kill: () => void }]`: 
  - A tuple containing:
    1. A function to run the worker with the provided input, returning a promise that resolves with the result.
    2. An object with the current status of the worker and a function to terminate the worker.

#### State Variables
- `status`: Tracks the current status of the worker (`"idle"`, `"running"`, `"error"`).
- `worker`: Holds the reference to the Web Worker instance.

#### Effect Hook
- The `useEffect` hook initializes the Web Worker when the component mounts and cleans up when the component unmounts or dependencies change. It:
  - Defines the worker function to handle messages and errors.
  - Converts the worker function to a string and creates a `Blob` object.
  - Generates a URL for the worker script and creates a new `Worker` instance.
  - Sets the worker instance in the state.
  - Terminates the worker and revokes the URL when the component unmounts.

#### `runWorker` Function
- The `runWorker` function is used to send data to the worker and handle the result. It:
  - Checks if the worker is initialized.
  - Sets the status to `"running"`.
  - Returns a promise that resolves with the result or rejects with an error.
  - Sends the input data and the worker function string to the worker.
  - Handles messages and errors from the worker.

#### `kill` Function
- The `kill` function terminates the worker and resets the state. It:
  - Terminates the worker if it exists.
  - Sets the worker state to `null`.
  - Resets the status to `"idle"`.

### Usage Example

Here's how you can use the `useWebWorker` hook in a React component:

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

This setup ensures that the function is executed in a separate thread, keeping the main thread free for UI updates and other tasks.