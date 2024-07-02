import styles from './landing.module.scss'
import NavLink from './NavLInk'
// arrow up symbol: ↑
export default function LandingPage() {
  return (
    <div className={styles.container}>
      <NavLink />

      <div className={styles.infoContainer}>
        <h1>E2E Chat</h1>
        <div>
          <h2>Total Anonymity</h2>
          <p>
            <b>No Email or Phone Number Required:</b> Enjoy complete anonymity.
            Sign up and start chatting without sharing any personal information.
            Your identity is yours to keep.
          </p>
        </div>
        <div>
          <h2>Privacy</h2>
          <p>
            <b>Privacy First</b>: We don’t track your messages or store your
            data that is not required to use the app. Your conversations are
            private and secure. Enjoy peace of mind knowing your information is
            safe.
          </p>
          <p>
            <b>End-to-End Encryption</b>: Keep your conversations secure with
            end-to-end encryption. Your messages are for your eyes only. No one
            else can access them.
          </p>
        </div>

        <div>
          <h2>User-Friendly Interface</h2>
          <p>
            <b>Easy to Use</b>: Our intuitive interface makes secure
            communication simple. No technical knowledge required—just start
            chatting!
          </p>
          <p>
            <b>Instant Setup</b>: Get started in seconds. No lengthy sign-up
            processes or complicated settings. Just secure, instant
            communication.
          </p>
        </div>
      </div>
    </div>
  )
}
