import { cookies } from "next/headers";
import styles from "./page.module.css";
import { redirect } from "next/navigation";

const getUserInfo = async () => {
  const cookieStore = cookies();

  const res = await fetch("http://localhost:3000/auth/me", {
    headers: {
      Cookie: cookieStore.toString(),
    },
    credentials: "include",
  });
  if (res.ok) {
    const data = await res.json();
    return data;
  }
  console.error(res.statusText);
  return null;
};

export default async function Home() {
  const user = await getUserInfo();
  if (!user) {
    redirect("/login");
  }
  return (
    <main className={styles.main}>
      <h1>Home page</h1>
      <p>Welcome back, {user?.username}!</p>
    </main>
  );
}
