import { redirect } from "next/navigation";
import styles from "./auth.module.scss";
import { cookies } from "next/headers";

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
  return null;
};

export default async function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  console.log("🚀 ~ cookieStore:", cookieStore);
  const user = await getUserInfo();

  if (user) {
    redirect("/");
  }

  return (
    <main className={styles.authContainer}>
      <div className={styles.formWrapper}>{children}</div>
    </main>
  );
}
