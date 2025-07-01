import { useEffect, useState } from "react";
import Mneumonic from "./component/Mneumonic";
import Password from "./component/Password";
import Accounts from "./component/Accounts";
import { MemoryRouter, Route, Routes, Navigate } from "react-router-dom";
import "./index.css";

function App() {
  const [vaultExists, setVaultExists] = useState<boolean | null>(null);

  useEffect(() => {
    chrome.storage?.local.get("vault", (result) => {
      if (result && result.vault) {
        setVaultExists(true);
      } else {
        setVaultExists(false);
      }
    });
  }, []);

  if (vaultExists === null) {
    // still loading
    return (
      <div className="container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container">
      <MemoryRouter initialEntries={[vaultExists ? "/password" : "/"]}>
        <Routes>
          <Route path="/" element={<Mneumonic />} />
          <Route path="/password" element={<Password />} />
          <Route path="/account" element={<Accounts />} />
          {/* Fallback redirect */}
          <Route
            path="*"
            element={<Navigate to={vaultExists ? "/password" : "/"} />}
          />
        </Routes>
      </MemoryRouter>
    </div>
  );
}

export default App;
