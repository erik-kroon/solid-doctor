import { createEffect, createSignal, onMount, type JSX } from "solid-js";

let currentUserId: string | undefined;

type Props = {
  children: JSX.Element;
};

export function Profile(props: Props) {
  const [profile, setProfile] = createSignal<unknown>();

  createEffect(() => {
    void fetch("/api/profile").then(async (response) => {
      setProfile(await response.json());
    });
  });

  onMount(() => {
    window.addEventListener("resize", reportResize);
  });

  return (
    <section data-profile={String(profile())}>
      <main>{props.children}</main>
      <footer>{props.children}</footer>
    </section>
  );
}

export async function loadCurrentUser() {
  "use server";
  currentUserId = "user-1";
  return currentUserId;
}

function reportResize() {
  console.log("resize");
}
