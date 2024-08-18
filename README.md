# WebWorker + React + TypeScript

### Description of `useWebWorker` Hook

The `useWebWorker` hook is a custom React hook designed to leverage Web Workers for executing computationally intensive tasks in a separate thread. This helps keep the main thread responsive and improves the performance of your application. Here's a detailed breakdown of its components and functionality:

1. **Generics**:
   - `<T>`: The hook uses a generic type `T` to ensure type safety for the input data and the result.

2. **Parameters**:
   - `inputData: T`: The data to be processed by the Web Worker.
   - `workerFunction: () => void`: The function to be executed in the Web Worker.
   - `shouldExecute: boolean | number`: A flag to control whether the worker should execute. Defaults to `true`.

3. **State Variables**:
   - `result`: Stores the result of the worker's computation.
   - `error`: Stores any error message if the worker encounters an error.
   - `isLoading`: Indicates whether the worker is currently processing.

4. **Memoized Worker Function**:
   - `memoizedWorkerFunction`: The worker function is memoized using `useCallback` to prevent unnecessary re-creations.

5. **Effect Hook**:
   - The `useEffect` hook is used to manage the lifecycle of the Web Worker. It runs whenever `inputData`, `memoizedWorkerFunction`, or `shouldExecute` changes.

6. **Worker Creation and Communication**:
   - The worker function is converted to a string and wrapped in a `Blob` object. This blob is then used to create a URL, which serves as the script for the Web Worker.
   - A new `Worker` instance is created using the generated script URL.
   - The worker is sent the `inputData` via `postMessage`.
   - The worker's `onmessage` event handler updates the `result` state with the computed data.
   - The worker's `onerror` event handler updates the `error` state with any error message.

7. **Cleanup**:
   - The worker is terminated, and the URL is revoked when the component unmounts or dependencies change.

8. **Return Object**:
   - The hook returns an object containing `result`, `isLoading`, and `error` to be used in the component.

### Usage Example

Here's how you can use the `useWebWorker` hook in a React component:

```typescript
// src/App.tsx
import React, { useState } from 'react';
import useWebWorker from './useWebWorker';

const workerFunction = () => {
  onmessage = (e) => {
    const result = e.data * 2; // Example computation
    postMessage(result);
  };
};

const App: React.FC = () => {
  const [input, setInput] = useState<number>(0);
  const { result, isLoading, error } = useWebWorker(input, workerFunction);

  return (
    <div>
      <input
        type="number"
        value={input}
        onChange={(e) => setInput(Number(e.target.value))}
      />
      <div>
        {isLoading ? 'Loading...' : `Result: ${result}`}
        {error && <div>Error: {error}</div>}
      </div>
    </div>
  );
};

export default App;
```

This setup ensures that the function is executed in a separate thread, keeping the main thread free for UI updates and other tasks.


### Description of `webWorkerFunctionCreator` Function

The `webWorkerFunctionCreator` function is a utility designed to create and manage Web Workers in a TypeScript environment. It allows you to offload computationally intensive tasks to a separate thread, thereby keeping the main thread responsive. Here's a detailed breakdown of its components and functionality:

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
     - **terminate**: Terminates the worker, stopping its execution.
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
