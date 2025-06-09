"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

declare global {
  interface Window {
    ethereum?: any;
  }
}

const contractAddress = "0xb0e53957BCC04aeD42C69755070B5AfD187d53DA";
const contractABI = [
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "getETHAmountFor50USD",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address payable",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdraw50USDInETH",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "stateMutability": "payable",
    "type": "receive"
  }
];

export default function Home() {
  const [currentAccount, setCurrentAccount] = useState<string | null>(null);
  const [ethAmount, setEthAmount] = useState<string>("0");
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [contractBalance, setContractBalance] = useState<string>("0");
  const [depositAmount, setDepositAmount] = useState<string>("0.03");
  const [loading, setLoading] = useState<boolean>(false);
  const [darkMode, setDarkMode] = useState<boolean>(false);

  const checkIfWalletIsConnected = async () => {
    try {
      if (!window.ethereum) {
        toast.warn("Please install MetaMask!");
        return;
      }

      const accounts = await window.ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        setCurrentAccount(account);
        checkIfOwner(account);
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        toast.warn("Please install MetaMask!");
        return;
      }

      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setCurrentAccount(accounts[0]);
      checkIfOwner(accounts[0]);
    } catch (error) {
      console.error(error);
    }
  };

  const checkIfOwner = async (account: string) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    const owner = await contract.owner();
    setIsOwner(owner.toLowerCase() === account.toLowerCase());
  };

  const getETHAmount = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    const amount = await contract.getETHAmountFor50USD();
    setEthAmount(ethers.utils.formatEther(amount));
  };

  const getContractBalance = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balance = await provider.getBalance(contractAddress);
    setContractBalance(ethers.utils.formatEther(balance));
  };

  const depositETH = async () => {
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      const tx = await signer.sendTransaction({
        to: contractAddress,
        value: ethers.utils.parseEther(depositAmount),
      });

      await tx.wait();
      toast.success("ETH deposited successfully!");
      getContractBalance();
    } catch (error) {
      toast.error("Error while depositing");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async () => {
    try {
      setLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, contractABI, signer);

      const tx = await contract.withdraw50USDInETH();
      await tx.wait();
      toast.success("Withdrawal successful!");
      getContractBalance();
    } catch (error) {
      toast.error("Error while withdrawing");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    getETHAmount();
    getContractBalance();

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: string[]) => {
        if (accounts.length === 0) {
          setCurrentAccount(null);
          setIsOwner(false);
        } else {
          setCurrentAccount(accounts[0]);
          checkIfOwner(accounts[0]);
        }
      });
    }

    // Check user's preferred color scheme
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gradient-to-b from-blue-50 to-white text-gray-800'}`}>
      <ToastContainer position="top-right" autoClose={5000} />
      <header className={`${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-blue-500">USD Withdrawer</h1>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-300' : 'bg-gray-200 text-gray-700'}`}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
          {currentAccount ? (
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${darkMode ? 'bg-gray-700' : 'bg-blue-100'} px-3 py-1 rounded-full`}>
                {currentAccount.slice(0, 6)}...{currentAccount.slice(-4)}
              </span>
              <button
                onClick={() => setCurrentAccount(null)}
                className="px-3 py-1 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className={`rounded-xl shadow-md overflow-hidden p-6 mb-8 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className="text-xl font-semibold mb-4">Contract Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>Contract Balance</p>
              <p className="text-lg font-medium">{contractBalance} ETH</p>
            </div>
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>50 USD in ETH</p>
              <p className="text-lg font-medium">{ethAmount} ETH</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`rounded-xl shadow-md overflow-hidden p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-semibold mb-4">Deposit ETH</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="deposit" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Amount (ETH)
                </label>
                <input
                  type="number"
                  id="deposit"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${darkMode ? 'bg-gray-700 border-gray-600 focus:ring-blue-500' : 'border-gray-300 focus:ring-blue-500'}`}
                  step="0.001"
                  min="0.001"
                />
              </div>
              <button
                onClick={depositETH}
                disabled={!currentAccount || loading}
                className="w-full py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Processing..." : "Deposit"}
              </button>
            </div>
          </div>

          {isOwner && (
            <div className={`rounded-xl shadow-md overflow-hidden p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className="text-xl font-semibold mb-4">Withdraw 50 USD</h2>
              <div className="space-y-4">
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  You can withdraw the equivalent of 50 USD in ETH (Owner only)
                </p>
                <button
                  onClick={withdraw}
                  disabled={loading}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "Processing..." : "Withdraw"}
                </button>
              </div>
            </div>
          )}
        </div>

        {isOwner && (
          <div className={`mt-6 p-4 rounded border-l-4 ${darkMode ? 'bg-yellow-900 border-yellow-500' : 'bg-yellow-50 border-yellow-400'}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className={`text-sm ${darkMode ? 'text-yellow-200' : 'text-yellow-700'}`}>
                  You are the owner of this contract. You can withdraw funds whenever you want.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}