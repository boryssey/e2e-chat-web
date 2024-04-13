"use client";
import Button from "@/components/button";
import Input from "@/components/input";
import { useRouter } from "next/navigation";
import { useForm, SubmitHandler } from "react-hook-form";
import styles from "../auth.module.scss";
import { useState } from "react";

type Inputs = {
  username: string;
  password: string;
};

export default function LoginPage() {
  const router = useRouter();
  const [loginError, setLoginError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  const onLogin: SubmitHandler<Inputs> = async (data) => {
    console.log("onLogin, ;");
    const res = await fetch("http://localhost:3000/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!res.ok) {
      const error = await res.json();
      console.error(error, "error");
      setLoginError(error.message);
      return;
    }

    console.log(res, "res success");
    router.push("/");
  };

  return (
    <>
      <h1>LOGIN</h1>
      <form onSubmit={handleSubmit(onLogin)} id="loginForm">
        <Input
          {...register("username", {
            required: { value: true, message: "Username is required" },
          })}
          name="username"
          placeholder="Username"
          type="text"
        />
        <Input
          {...register("password", {
            required: { value: true, message: "Password is required" },
          })}
          name="password"
          placeholder="Password"
          type="password"
        />
      </form>
      {Object.values(errors).length > 0 && (
        <div className={styles.errorWrapper}>
          {loginError && <p>{loginError}</p>}
          {Object.values(errors).map((error, index) => (
            <p key={index}>{error.message}</p>
          ))}
        </div>
      )}
      <div className={styles.actionWrapper}>
        <a href="/auth/register">Register instead</a>
        <Button form="loginForm" withArrow>
          LOGIN
        </Button>
      </div>
    </>
  );
}
