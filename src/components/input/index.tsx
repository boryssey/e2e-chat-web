import { DetailedHTMLProps, InputHTMLAttributes, forwardRef } from "react";
import styles from "./input.module.css";

type InputProps = {
  type: "text" | "password";
  color?: "secondary" | "primary";
} & DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;

type InpurRef = HTMLInputElement;

const Input = forwardRef<InpurRef, InputProps>(function Input(
  { color = "primary", ...props },
  ref,
) {
  return <input ref={ref} className={styles[color]} {...props} />;
});

export default Input;
