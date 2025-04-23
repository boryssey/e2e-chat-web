import Page from './page'
import Layout from './layout'

export default function DefaultUser() {
  console.log('default user called')
  return (
    <Layout>
      <Page />
    </Layout>
  )
}
