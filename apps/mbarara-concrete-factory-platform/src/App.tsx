import { initialState } from "./data/seedData";
import { useLocalStorageState } from "./lib/useLocalStorage";
import { PublicWebsiteModule } from "./modules/PublicWebsiteModule";
import type { AppState } from "./types";

const storageKey = "mbarara-concrete-factory-platform-state-v2-130m-lean-launch";

export default function App() {
  const [state] = useLocalStorageState<AppState>(storageKey, initialState);

  return <PublicWebsiteModule state={state} />;
}
