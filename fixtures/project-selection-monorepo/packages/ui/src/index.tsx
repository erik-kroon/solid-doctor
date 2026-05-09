type Props = {
  label: string;
};

export function Label(props: Props) {
  const label = props.label;

  return <span>{label}</span>;
}
