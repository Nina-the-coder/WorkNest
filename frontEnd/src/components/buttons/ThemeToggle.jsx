import { useState } from "react";
import Icon from "../Icons";

const ThemeToggle = () => {
  const [mode, setMode] = useState("light");

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle("dark");
    if (mode === "light") {
      setMode("dark");
    } else {
      setMode("light");
    }
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="h-[50px] w-[50px] rounded-[50%] bg-bg mx-4 text-text flex flex-col justify-center items-center"
    >
      <Icon
        name={mode === "light" ? "moon" : "sun"}
        className={mode === "dark" ? "text-amber-300" : ""}
      />
    </button>
  );
};

export default ThemeToggle;
