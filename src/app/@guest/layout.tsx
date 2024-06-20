import styles from './guest.module.scss'

const GuestLayout = ({
  auth,
  landing,
}: {
  children: React.ReactNode
  auth: React.ReactNode
  landing: React.ReactNode
}) => {
  console.log('guest layout called')
  return (
    <div className={styles.container}>
      {landing}
      {auth}
    </div>
  )
}

export default GuestLayout
