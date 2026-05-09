import { For, createEffect, createSignal, onMount } from "solid-js";

type Props = {
  name: string;
};

export function Profile(props: Props) {
  const initialName = props.name;
  const [items] = createSignal(["Ada", "Grace"]);
  const staticNames = ["Katherine", "Dorothy"].map((name) => name.toUpperCase());

  createEffect(() => {
    console.log(initialName, props.name);
  });

  createEffect(async () => {
    const name = props.name;
    await Promise.resolve();
    console.log(name);
  });

  onMount(() => {
    console.log(window.location.href);
  });

  return (
    <section>
      <p>{staticNames.join(", ")}</p>
      <For each={items()}>{(item) => <span>{item}</span>}</For>
    </section>
  );
}
