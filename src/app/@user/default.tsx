import Page from "./page";
import Layout from "./layout";

export default function DefaultUser({ ...props }) {
  console.log("default user called");
  return (
    <Layout>
      <Page {...props} />
    </Layout>
  );
}
