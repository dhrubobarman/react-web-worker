import { useState } from "react";
import useWebWorker from "./hooks/useWebWorker";

function workerFunction() {
  self.onmessage = function () {
    let result: number = 0;
    for (let i = 0; i < 10000000000; i++) {
      result += i;
    }
    self.postMessage(result);
  };
}

function ExampleWithHook() {
  const [shouldExecute, setShouldExecute] = useState(0);
  const { result, isLoading, error } = useWebWorker(
    "null",
    workerFunction,
    shouldExecute
  );
  const [count, setCount] = useState(0);

  function executionResult() {
    if (error) return <>error: {error}</>;
    if (isLoading)
      return (
        <>
          loading...{" "}
          <button
            style={{ marginInline: "auto", display: "block" }}
            onClick={() => setShouldExecute(0)}
          >
            Stop execution
          </button>
        </>
      );

    return (
      <>
        {result}{" "}
        <button
          style={{ marginInline: "auto", display: "block" }}
          onClick={() => setShouldExecute((prev) => prev + 1)}
        >
          {shouldExecute > 0 ? "Restart" : "Start"} execution
        </button>
      </>
    );
  }

  return (
    <div>
      <div
        style={{ marginBottom: 8, display: "flex", flexDirection: "column" }}
      >
        <span style={{ marginBottom: 8 }}>
          This example is with web worker hook
        </span>
        <button onClick={() => setCount((prev) => prev + 1)}>
          Increse {count}
        </button>
      </div>
      {executionResult()}
    </div>
  );
}

export default ExampleWithHook;
