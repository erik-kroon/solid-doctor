import { createStore } from "solid-js/store";

export function App() {
  const [state] = createStore({ profile: { name: "Ada" } });
  const { profile } = state;

  return <h1>{profile.name}</h1>;
}
