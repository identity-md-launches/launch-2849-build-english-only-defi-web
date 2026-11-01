import { useRoute } from "./router";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { Markets } from "./pages/Markets";
import { MarketDetail } from "./pages/MarketDetail";
import { Revenue } from "./pages/Revenue";
import { FundPage, FundsIndex } from "./pages/Funds";
import { Charity } from "./pages/Charity";
import { Portfolio } from "./pages/Portfolio";
import { HowItWorks, Security } from "./pages/Info";
import { NotFound } from "./pages/NotFound";
import { PROJECT_NAME } from "./config/site";
import { useEffect } from "react";

const TITLES: Record<string, string> = {
  "/markets": "Markets", "/revenue": "Revenue Split", "/funds": "Funds", "/charity": "Charity Fund",
  "/portfolio": "Portfolio", "/how": "How it works", "/security": "Security",
  "/funds/assurance": "Assurance Fund", "/funds/incentive": "Advertising & User Incentive Fund", "/funds/revenue": "Revenue Fund",
};

function page(route: string) {
  if (route === "/") return <Home />;
  if (route === "/markets") return <Markets />;
  const mm = route.match(/^\/markets\/([a-z]+)$/);
  if (mm) return <MarketDetail id={mm[1]} />;
  if (route === "/revenue") return <Revenue />;
  if (route === "/funds") return <FundsIndex />;
  if (route === "/funds/assurance") return <FundPage key="a" id="assurance" />;
  if (route === "/funds/incentive") return <FundPage key="i" id="incentive" />;
  if (route === "/funds/revenue") return <FundPage key="r" id="revenue" />;
  if (route === "/charity") return <Charity />;
  if (route === "/portfolio") return <Portfolio />;
  if (route === "/how") return <HowItWorks />;
  if (route === "/security") return <Security />;
  return <NotFound />;
}

export function App() {
  const route = useRoute();
  useEffect(() => {
    const mm = route.match(/^\/markets\/([a-z]+)$/);
    const t = TITLES[route] ?? (mm ? "Market" : null);
    document.title = t ? `${t} · ${PROJECT_NAME}` : `${PROJECT_NAME}: lend and borrow against tokenized real-world assets`;
  }, [route]);
  return <Layout route={route}>{page(route)}</Layout>;
}
