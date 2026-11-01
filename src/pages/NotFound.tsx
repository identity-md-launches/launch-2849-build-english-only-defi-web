import { PageHead } from "../components/ui";
export function NotFound() {
  return (
    <div className="wrap">
      <PageHead title="Page not found" lead="This address does not match a page." />
      <a className="btn btn-primary" href="#/markets">Go to markets</a>
    </div>
  );
}
