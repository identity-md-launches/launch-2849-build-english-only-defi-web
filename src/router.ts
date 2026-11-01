import { useEffect, useState } from "react";

/** Hash routing: works on any static host, IPFS gateway subpath or ENS name. */
export function useRoute() {
  const get = () => (location.hash.replace(/^#/, "") || "/").split("?")[0];
  const [route, setRoute] = useState(get);
  useEffect(() => {
    const on = () => {
      setRoute(get());
      window.scrollTo(0, 0);
      // Move focus to the new page's heading so keyboard and screen-reader users land on it.
      requestAnimationFrame(() => document.querySelector<HTMLElement>("main h1")?.focus());
    };
    addEventListener("hashchange", on);
    return () => removeEventListener("hashchange", on);
  }, []);
  return route;
}
