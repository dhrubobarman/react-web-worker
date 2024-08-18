import { useEffect, useState } from "react";

const ExampleWithNormalFunction = () => {
  const [input, setInput] = useState<number>(0);
  const [result, setResult] = useState<number | null>(null);

  useEffect(() => {
    setResult(() => {
      let result = 0;
      for (let i = 0; i < Math.abs(+input); i++) {
        result += i;
      }
      return result;
    });
  }, [input]);

  return (
    <div>
      <label>
        <p style={{ display: "block" }}>
          Example With normal function: it will not freeze the browser once
          passed a large number.
        </p>
        <input
          type="number"
          style={{
            display: "block",
            padding: 10,
            marginBottom: 5,
            borderRadius: "5px",
            boxShadow: "none",
            minWidth: 191,
          }}
          value={input}
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

export default ExampleWithNormalFunction;
