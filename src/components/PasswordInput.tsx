"use client";

import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { EyeIcon, EyeOffIcon } from "./icons";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * A password field with an eye button that lets people see what they typed.
 * It accepts the same props as a normal <input> (value, onChange, required, ...).
 */
export default function PasswordInput({ className = "", ...props }: Props) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={show ? "text" : "password"}
        className={className}
        style={{ paddingRight: "3rem" }}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-500 transition hover:text-brand-700"
      >
        {show ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
      </button>
    </div>
  );
}
