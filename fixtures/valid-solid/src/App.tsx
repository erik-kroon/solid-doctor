type Props = {
  name: string;
};

export function Greeting(props: Props) {
  return <h1>Hello {props.name}</h1>;
}
