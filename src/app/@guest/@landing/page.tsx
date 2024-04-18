import styles from "./landing.module.scss";

export default function LandingPage() {
  console.log("landing page called");
  return (
    <div className={styles.container}>
      <h1>Landing Page</h1>
    </div>
  );
}
