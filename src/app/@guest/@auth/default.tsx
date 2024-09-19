import Page from './login/page'
import Layout from './layout'
// eslint-disable-next-line @typescript-eslint/require-await
const DefaultLanding = async ({ ...props }) => {
  return (
    <Layout>
      <Page {...props} />
    </Layout>
  )
}

export default DefaultLanding
