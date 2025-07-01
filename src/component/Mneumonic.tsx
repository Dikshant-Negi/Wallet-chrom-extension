import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateMnemonic } from "bip39";
import "../index.css";
import { useVault } from "../store/profileSlice";

export default function Mnemonic() {
  const [mnemonic,setMnemonic] = useState<string[]>([])
  const setMnemonicInVault = useVault((state)=>state.setMnemonic)
  const navigate = useNavigate();
  const handleGenerate = () => {
    const newMnemonic = generateMnemonic();
    setMnemonic(newMnemonic.split(" "));
    setMnemonicInVault(newMnemonic)
  };

  function handleNext() {
    navigate("/password");
  }
  return (
    <div className="mneumonic-container">
      <span className="heading">Mneumonic</span>
      <div className="mneumonic">
        {mnemonic.map((item) => (
          <span className="word">{item}</span>
        ))}
      </div>
      {mnemonic.length > 0 ? (
        <button className="button" onClick={() => handleNext()}>
          Continue
        </button>
      ) : (
        <button className="button" onClick={() => handleGenerate()}>
          Generate
        </button>
      )}
    </div>
  );
}
