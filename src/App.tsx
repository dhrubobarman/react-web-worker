import ExampleWithFunction from "./ExampleWithFunction";
import ExampleWithHook from "./ExampleWithHook";
import ExampleWithNormalFunction from "./ExampleWithNormalFunction";

function App() {
  return (
    <div className="grid">
      <ExampleWithHook />
      <ExampleWithFunction />
      <ExampleWithNormalFunction />
    </div>
  );
}

export default App;
