import { createEffect, createSignal } from "solid-js";

type Props = {
  first: string;
  last: string;
};

export function Profile(props: Props) {
  const [fullName, setFullName] = createSignal("");
  const [items] = createSignal(["Ada", "Grace"]);
  const title = document.title;

  createEffect(() => {
    setFullName(`${props.first} ${props.last}`);
  });

  createEffect(async () => {
    await fetch("/api/profile");
    console.log(props.first);
  });

  return (
    <section aria-label={title}>
      <h1>{fullName()}</h1>
      <ul>
        {items().map((item) => (
          <li>{item}</li>
        ))}
      </ul>
    </section>
  );
}
