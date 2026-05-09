type Props = {
  name: string;
};

export function Greeting(props: Props) {
  const name = props.name;

  return <h1>Hello {name}</h1>;
}
