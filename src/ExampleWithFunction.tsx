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

const ExampleWithFunction = () => {
  const [input, setInput] = useState<number>(0);
  const [result, setResult] = useState<number | null>(null);

  const handleChange = async (value: number) => {
    setInput(value);
    try {
      if (runWorker) {
        const result = await runWorker(value);
        setResult(result);
      }
    } catch (error) {
      console.error(error);
    }
  };

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
          onChange={(e) => handleChange(e.target.valueAsNumber)}
        />
      </label>
      <button
        onClick={() => handleChange(200000000 + input)}
        style={{ display: "block" }}
      >
        Increse Value by 200M
      </button>
      <div>Result: {result}</div>
    </div>
  );
};

export default ExampleWithFunction;
