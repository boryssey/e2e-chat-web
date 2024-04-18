import Page from "./page";

export default function DefaultUser({ ...props }) {
  console.log("default user called");
  return <Page {...props} />;
}
