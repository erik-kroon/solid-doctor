import { createEffect, createSignal } from "solid-js";

type Props = {
  first: string;
  last: string;
};

export function Profile(props: Props) {
  const [fullName, setFullName] = createSignal("");
  const [items] = createSignal(["Ada", "Grace"]);
  // solid-doctor-disable-next-line solid/browser-global-in-ssr
  const title = document.title;
  // solid-doctor-disable-next-line solid/browser-global-in-ssr

  // solid-doctor-disable-next-line solid/dynamic-map-in-jsx
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
        {/* solid-doctor-disable-next-line solid/dynamic-map-in-jsx */}
        {items().map((item) => (
          <li>{item}</li>
        ))}
      </ul>
    </section>
  );
}
