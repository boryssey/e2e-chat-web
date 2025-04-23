import Page from './login/page'
import Layout from './layout'
// eslint-disable-next-line @typescript-eslint/require-await
const DefaultLanding = async () => {
  return (
    <Layout>
      <Page />
    </Layout>
  )
}

export default DefaultLanding
