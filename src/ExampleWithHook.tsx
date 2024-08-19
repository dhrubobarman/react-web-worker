import { useState } from "react";
import useWebWorker from "./hooks/useWebWorker";

function workerFunction(n = 10000000000) {
  let result: number = 0;
  for (let i = 0; i < n; i++) {
    result += i;
  }
  return result;
}

function ExampleWithHook() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [runCalculation, { status, kill }] = useWebWorker<number, number>(
    workerFunction
  );
  const [result, setResult] = useState(0);
  const [count, setCount] = useState(0);
  const [input, setInput] = useState(10000000000);

  const onWorkerClick = async () => {
    try {
      const result = await runCalculation(input);
      setResult(result);
    } catch (error) {
      console.error("Worker error:", error);
    }
  };

  return (
    <div>
      <div
        style={{ marginBottom: 8, display: "flex", flexDirection: "column" }}
      >
        <span style={{ marginBottom: 8 }}>
          This example is with web worker hook
        </span>
        <input
          style={{
            display: "block",
            padding: 10,
            marginBottom: 5,
            borderRadius: "5px",
            boxShadow: "none",
            minWidth: 191,
          }}
          type="number"
          value={input}
          onChange={(e) => setInput(+e.target.value)}
        />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 8,
          }}
        >
          <button onClick={() => setCount((prev) => prev + 1)}>
            Increse {count}
          </button>
          <button onClick={() => setCount((prev) => prev - 1)}>
            Decrese {count}
          </button>
          <button onClick={() => setResult(0)}>Reset</button>
          <button onClick={onWorkerClick}>Calculate</button>
        </div>
        <div>Status: {status}</div>
        <div>Result: {result}</div>
      </div>
    </div>
  );
}

export default ExampleWithHook;
