import { children, createEffect, createResource, onCleanup, onMount, type JSX } from "solid-js";

type Props = {
  children: JSX.Element;
  userId: string;
};

export function Profile(props: Props) {
  const resolved = children(() => props.children);
  const [profile] = createResource(
    () => props.userId,
    async (userId) => {
      const response = await fetch(`/api/profile/${encodeURIComponent(userId)}`);
      return response.json();
    },
  );

  createEffect(() => {
    const timer = setInterval(() => console.log(profile()), 1000);
    onCleanup(() => clearInterval(timer));
  });

  onMount(() => {
    window.addEventListener("resize", reportResize);
    onCleanup(() => window.removeEventListener("resize", reportResize));
  });

  return (
    <section data-profile={String(profile())}>
      <main>{resolved()}</main>
      <footer>{resolved()}</footer>
    </section>
  );
}

function reportResize() {
  console.log("resize");
}
