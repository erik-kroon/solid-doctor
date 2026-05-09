import { createSignal } from "solid-js";

export function Hidden() {
  const [items] = createSignal(["Ada"]);

  return (
    <ul>
      {items().map((item) => (
        <li>{item}</li>
      ))}
    </ul>
  );
}
