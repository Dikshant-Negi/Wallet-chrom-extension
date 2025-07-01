import { useState } from "react";
import { useVault } from "../store/profileSlice";
import { useNavigate } from "react-router-dom";

function Password() {
  const [password, setPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mneumonic = useVault((state) => state.mnemonic);
  const setVaultPassword = useVault((state) => state.setPassword);
  const navigate = useNavigate();

  const handleSave = async () => {
    if (!password) return;

    chrome.storage.local.get("vault", async (result) => {
      const existingVault = result.vault;

      if (existingVault) {
        // Vault exists: try to decrypt it
        try {
         
          const encoder = new TextEncoder();
          const salt = Uint8Array.from(atob(existingVault.salt), c => c.charCodeAt(0));
          const iv = Uint8Array.from(atob(existingVault.iv), c => c.charCodeAt(0));
          const ciphertext = Uint8Array.from(atob(existingVault.ciphertext), c => c.charCodeAt(0));

          // Derive key
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

          // Try decrypting
          await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            key,
            ciphertext
          );

          // ✅ Success
          setVaultPassword(password);
          navigate('/account');

        } catch (err) {
          console.error("Incorrect password:", err);
          setError("Incorrect password. Please try again.");
        }
      } else {
        // No vault exists yet — first-time user
        if (!mneumonic) {
          setError("Mnemonic not found. Please go back and generate it.");
          return;
        }

        try {
          const encoder = new TextEncoder();
          const salt = crypto.getRandomValues(new Uint8Array(16));
          const iv = crypto.getRandomValues(new Uint8Array(12));

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
            ["encrypt", "decrypt"]
          );

          const ciphertext = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv },
            key,
            encoder.encode(mneumonic)
          );

          const payload = {
            salt: btoa(String.fromCharCode(...new Uint8Array(salt))),
            iv: btoa(String.fromCharCode(...new Uint8Array(iv))),
            ciphertext: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
            index: 1
          };

          chrome.storage.local.set({ vault: payload }, () => {
            setVaultPassword(password);
            navigate('/account');
          });
        } catch (err) {
          console.error("Error saving vault:", err);
          setError("An error occurred while saving. Please try again.");
        }
      }
    });
  };

  return (
    <div className="password-container">
      <h2 className="password-title">Secure Your Wallet</h2>
      <p className="password-subtitle">
        Please enter your password to unlock or create your vault
      </p>

      <input
        type="password"
        className="password-input"
        placeholder="Enter your password"
        onChange={(e) => {
          setError(null);
          setVaultPassword(e.target.value);
          setPassword(e.target.value);
        }}
      />

      <button className="button" onClick={handleSave}>
        Continue
      </button>

      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

export default Password;
