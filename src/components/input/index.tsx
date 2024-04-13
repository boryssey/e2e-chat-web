import { DetailedHTMLProps, InputHTMLAttributes, forwardRef } from "react";
import styles from "./input.module.scss";

type InputProps = { type: "text" | "password" } & DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
>;

type InpurRef = HTMLInputElement;

const Input = forwardRef<InpurRef, InputProps>(function Input(props, ref) {
  return <input ref={ref} className={styles.input} {...props} />;
});

export default Input;
