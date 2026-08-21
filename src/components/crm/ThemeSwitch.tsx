import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Switch } from "../ui/switch";

const STORAGE_KEY = "crm-manaus-tema";

export function ThemeSwitch() {
  const [dark, setDark] = useState(false);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    const salvo = localStorage.getItem(STORAGE_KEY);
    const inicial =
      salvo === "dark" ||
      (salvo === null && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(inicial);
    setPronto(true);
  }, []);

  useEffect(() => {
    if (!pronto) return;
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem(STORAGE_KEY, dark ? "dark" : "light");
  }, [dark, pronto]);

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
      <Sun className="h-4 w-4 text-muted-foreground" aria-hidden />
      <Switch
        checked={dark}
        onCheckedChange={setDark}
        aria-label="Alternar tema claro e escuro"
      />
      <Moon className="h-4 w-4 text-muted-foreground" aria-hidden />
    </div>
  );
}
