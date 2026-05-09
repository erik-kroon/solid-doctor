import { createStore } from "solid-js/store";

export function App() {
  const [state] = createStore({ profile: { name: "Ada" } });

  return <h1>{state.profile.name}</h1>;
}
