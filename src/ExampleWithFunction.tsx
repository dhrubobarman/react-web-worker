import { useEffect, useState } from "react";
import { webWorkerFunctionCreator } from "./hooks/useWebWorker";

const ExampleWithFunction = () => {
  const [input, setInput] = useState<number>(0);
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    const worker = webWorkerFunctionCreator<number, (num: number) => number>(
      (num: number) => {
        let result = 0;
        for (let i = 0; i < Math.abs(+num); i++) {
          result += i;
        }
        return result;
      }
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
      <label>
        <p style={{ display: "block" }}>
          Example With web worker function: it will not freeze the browser
        </p>
        <input
          type="number"
          value={input}
          style={{
            display: "block",
            padding: 10,
            marginBottom: 5,
            borderRadius: "5px",
            boxShadow: "none",
            minWidth: 191,
          }}
          onChange={(e) => setInput(Number(e.target.value))}
        />
      </label>
      <button
        onClick={() => setInput((prev) => prev + 200000000)}
        style={{ display: "block" }}
      >
        Increse Value by 200M
      </button>
      <div>Result: {result}</div>
    </div>
  );
};

export default ExampleWithFunction;
