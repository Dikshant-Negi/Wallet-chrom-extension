import { useEffect, useState } from "react";
import { useVault } from "../store/profileSlice";
import { mnemonicToSeed } from "bip39";
import { Wallet, HDNodeWallet } from "ethers";
import { useNavigate } from "react-router-dom";
function Accounts() {
  const password = useVault((state) => state.password);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [index, setIndex] = useState<number>(0);
  const navigate = useNavigate();
  useEffect(() => {
    loadVaultAndGenerateAccounts();
  }, []);

  const loadVaultAndGenerateAccounts = () => {
    if (!password) return;
    chrome.storage.local.get("vault", async (result) => {
      const vault = result.vault;
      if (!vault) return;

      try {
        const salt = Uint8Array.from(atob(vault.salt), (c) => c.charCodeAt(0));
        const iv = Uint8Array.from(atob(vault.iv), (c) => c.charCodeAt(0));
        const ciphertext = Uint8Array.from(atob(vault.ciphertext), (c) =>
          c.charCodeAt(0)
        );
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();

        const keyMaterial = await crypto.subtle.importKey(
          "raw",
          encoder.encode(password),
          { name: "PBKDF2" },
          false,
          ["deriveKey"]
        );

        const key = await crypto.subtle.deriveKey(
          {
            name: "PBKDF2",
            salt,
            iterations: 100000,
            hash: "SHA-256",
          },
          keyMaterial,
          { name: "AES-GCM", length: 256 },
          true,
          ["decrypt"]
        );

        // Decrypt mnemonic
        const decrypted = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv },
          key,
          ciphertext
        );

        const mnemonic = decoder.decode(decrypted);
        console.log("Decrypted mnemonic:", mnemonic);

        const numAccounts = vault.index;
        setIndex(numAccounts);

        const derived: string[] = [];
        for (let i = 0; i < numAccounts; i++) {
          const address = await getDerivationPath(i, mnemonic);
          derived.push(address);
        }
        setAccounts(derived);
      } catch (err) {
        console.error("Failed to decrypt:", err);
      }
    });
  };

  const handleAddAccount = () => {
    const newIndex = index + 1;

    chrome.storage.local.get("vault", (result) => {
      const vault = result.vault;
      if (!vault) return;

      vault.index = newIndex;
      chrome.storage.local.set({ vault }, () => {
        setIndex(newIndex);
        loadVaultAndGenerateAccounts();
      });
    });
  };

  const getDerivationPath = async (accountIndex: number, mnemonic: string) => {
    const seed = await mnemonicToSeed(mnemonic);
    const derivationPath = `m/44'/60'/${accountIndex}'/0'`;
    const hdNode = HDNodeWallet.fromSeed(seed);
    const child = hdNode.derivePath(derivationPath);
    const privateKey = child.privateKey;
    const publicKey = new Wallet(privateKey);
    return publicKey.address;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => alert("Address copied to clipboard!"))
      .catch(() => alert("Failed to copy!"));
  };

  return (
    <div className="accounts-container">
      <div className="accounts-header">
        <h2>Accounts</h2>
        <button className="button" onClick={handleAddAccount}>
          Add Account
        </button>
      </div>

      <div className="accounts-list">
        {accounts.length === 0 ? (
          <p>No accounts found. Add your first account!</p>
        ) : (
          accounts.map((acc, idx) => (
            <div
              key={idx}
              className="account-item"
          
            >
              <div className=""     onClick={() => navigate(`/balance?key=${acc}`)}>
              <span>{"Eth"}</span>
              <code>{truncateText(acc, 20, true)}</code>
              </div>
             
              <button
                className="copy-button"
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(acc);
                }}
              >
                📋
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function truncateText(
  text: string,
  maxLength: number,
  ellipsis: boolean = true
): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + (ellipsis ? "..." : "");
}

export default Accounts;
