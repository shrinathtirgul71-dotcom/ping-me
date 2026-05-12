import CallerPage from "./CallerPage";
import PhonePage from "./PhonePage";

export default function App() {
  const isPhone = window.location.search.includes("phone");
  return isPhone ? <PhonePage /> : <CallerPage />;
}
