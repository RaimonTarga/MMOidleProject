import { useEffect, useState } from "react";
export function LoadoutFeedback({ system }: { system: string }) {
  const [error, setError] = useState("");
  useEffect(() => {
    const handle = (event: Event) => { const result = (event as CustomEvent<{ system: string; success: boolean; reason?: string }>).detail; if (result.system === system) setError(result.success ? "" : result.reason ?? "The configuration could not be applied."); };
    window.addEventListener("hud:loadoutResult", handle);
    return () => window.removeEventListener("hud:loadoutResult", handle);
  }, [system]);
  return error ? <p className="rune-error" role="alert">{error}</p> : null;
}
