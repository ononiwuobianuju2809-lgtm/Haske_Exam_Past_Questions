import { ButtonHTMLAttributes, useRef, useState } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger";
};

export default function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const [pressed, setPressed] = useState(false);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const press = () => {
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    setPressed(true);
  };

  // Keep the "pressed" look visible a little longer than a real tap lasts,
  // so it never disappears too fast to notice
  const release = () => {
    releaseTimer.current = setTimeout(() => setPressed(false), 150);
  };

  const baseColor =
    variant === "secondary" ? "bg-gray-600" : variant === "danger" ? "bg-red-600" : "bg-navy";
  const pressedColor =
    variant === "secondary"
      ? "bg-gray-700"
      : variant === "danger"
      ? "bg-red-700"
      : "bg-navy-dark";

  return (
    <button
      {...props}
      onPointerDown={press}
      onPointerUp={release}
      onPointerLeave={release}
      onPointerCancel={release}
      className={`w-full sm:w-auto text-white font-semibold py-3 px-6 rounded-md
        transition duration-150 ${pressed ? `${pressedColor} scale-[0.97]` : baseColor}
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}