import { createSignal } from "solid-js";

export function Legacy() {
  const [items] = createSignal(["Ada"]);

  return (
    <ul>
      {items().map((item) => (
        <li>{item}</li>
      ))}
    </ul>
  );
}
