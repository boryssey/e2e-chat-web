import { cookies } from "next/headers";
import styles from "./page.module.css";
import { redirect } from "next/navigation";



export default async function Home() {
  return (
    <main className={styles.main}>
      <h1>Home page</h1>
      {/* <p>Welcome back, {user?.username}!</p> */}
    </main>
  );
}
