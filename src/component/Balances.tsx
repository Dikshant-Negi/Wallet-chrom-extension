import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { formatUnits } from "ethers";

const ALCHEMY_URL = `https://eth-sepolia.g.alchemy.com/v2/WK9u-Qyhb5DdGvRxeQwdh`;

function Balances() {
  const [searchParams] = useSearchParams();
  const publickey = searchParams.get("key");
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const navigate = useNavigate();

  // Fetch balances
  async function getBalance() {
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const body = JSON.stringify({
      id: 1,
      jsonrpc: "2.0",
      method: "alchemy_getTokenBalances",
      params: [publickey],
    });

    const response = await fetch(ALCHEMY_URL, {
      method: "POST",
      headers,
      body,
    });

    const data = await response.json();
    setBalance(data);
  }

  // Fetch transactions
  async function getTransactions() {
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const body = JSON.stringify({
      id: 2,
      jsonrpc: "2.0",
      method: "alchemy_getAssetTransfers",
      params: [{
        fromBlock: "0x0",
        toBlock: "latest",
        toAddress: publickey,
        category: ["external", "erc20"],
        withMetadata: true,
        maxCount: "0x10"
      }]
    });

    const response = await fetch(ALCHEMY_URL, {
      method: "POST",
      headers,
      body,
    });

    const data = await response.json();
    setTransactions(data.result.transfers || []);
  }

  useEffect(() => {
    if (publickey && publickey !== "undefined") {
      getBalance();
      getTransactions();
    }
  }, [publickey]);

  function formatTokenBalance(hex: string, decimals = 18) {
    try {
      return formatUnits(hex, decimals);
    } catch {
      return "0.00";
    }
  }

  return (
    <div className="container-balance">
      <header className="header">
        <span className="arrow" onClick={() => navigate(-1)}>←</span>
        <div className="title">Balances</div>
        <span className="arrow invisible">←</span>
      </header>

      {balance && balance.result ? (
        <div className="balance-container">
         
          {balance.result.tokenBalances.length > 0 ? (
            <ul>
              {balance.result.tokenBalances.map((token: any, index: number) => (
                <li key={index}>
                 
                  {formatTokenBalance(token.tokenBalance)} 
                </li>
              ))}
            </ul>
          ) : (
            <p>No tokens found.</p>
          )}
        </div>
      ) : (
        "Loading..."
      )}

      <div className="send-recive-contianer">
        <button className="send-recive-contianer-button">Send</button>
        <button className="send-recive-contianer-button">Receive</button>
      </div>

      {/* ✅ Transactions Table */}
      <div className="transactions-container">
        <h3>Recent Transactions</h3>
        {transactions.length > 0 ? (
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Hash</th>
                <th>From</th>
                <th>Value</th>
                <th>Asset</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx: any, index) => (
                <tr key={index}>
                  <td title={tx.hash}>{tx.hash.slice(0, 8)}...</td>
                  <td title={tx.from}>{tx.from?.slice(0, 8)}...</td>
                  <td>{tx.value || "0"}</td>
                  <td>{tx.asset || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No transactions found.</p>
        )}
      </div>
    </div>
  );
}

export default Balances;
