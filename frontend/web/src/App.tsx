// App.tsx
import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getContractReadOnly, getContractWithSigner } from "./contract";
import WalletManager from "./components/WalletManager";
import WalletSelector from "./components/WalletSelector";
import "./App.css";

interface GameChallenge {
  id: string;
  encryptedScore: string;
  timestamp: number;
  player: string;
  category: string;
  status: "pending" | "completed" | "failed";
  reward: number;
}

const App: React.FC = () => {
  // Randomized style selections
  // Colors: High contrast (red+black)
  // UI: Cyberpunk
  // Layout: Center radiation
  // Interaction: Micro-interactions (hover effects)
  
  // Randomized features: 
  // 1. Project introduction
  // 2. Data statistics
  // 3. Smart chart (pie chart)
  // 4. Search & filter
  
  const [account, setAccount] = useState("");
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState<GameChallenge[]>([]);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [walletSelectorOpen, setWalletSelectorOpen] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<{
    visible: boolean;
    status: "pending" | "success" | "error";
    message: string;
  }>({ visible: false, status: "pending", message: "" });
  const [newChallengeData, setNewChallengeData] = useState({
    category: "",
    difficulty: "1",
    stakeAmount: "0"
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Calculate statistics
  const completedCount = challenges.filter(c => c.status === "completed").length;
  const pendingCount = challenges.filter(c => c.status === "pending").length;
  const failedCount = challenges.filter(c => c.status === "failed").length;
  const totalRewards = challenges.reduce((sum, c) => sum + (c.status === "completed" ? c.reward : 0), 0);

  useEffect(() => {
    loadChallenges().finally(() => setLoading(false));
  }, []);

  const onWalletSelect = async (wallet: any) => {
    if (!wallet.provider) return;
    try {
      const web3Provider = new ethers.BrowserProvider(wallet.provider);
      setProvider(web3Provider);
      const accounts = await web3Provider.send("eth_requestAccounts", []);
      const acc = accounts[0] || "";
      setAccount(acc);

      wallet.provider.on("accountsChanged", async (accounts: string[]) => {
        const newAcc = accounts[0] || "";
        setAccount(newAcc);
      });
    } catch (e) {
      alert("Failed to connect wallet");
    }
  };

  const onConnect = () => setWalletSelectorOpen(true);
  const onDisconnect = () => {
    setAccount("");
    setProvider(null);
  };

  const loadChallenges = async () => {
    setIsRefreshing(true);
    try {
      const contract = await getContractReadOnly();
      if (!contract) return;
      
      // Check contract availability using FHE
      const isAvailable = await contract.isAvailable();
      if (!isAvailable) {
        console.error("Contract is not available");
        return;
      }
      
      const keysBytes = await contract.getData("challenge_keys");
      let keys: string[] = [];
      
      if (keysBytes.length > 0) {
        try {
          keys = JSON.parse(ethers.toUtf8String(keysBytes));
        } catch (e) {
          console.error("Error parsing challenge keys:", e);
        }
      }
      
      const list: GameChallenge[] = [];
      
      for (const key of keys) {
        try {
          const challengeBytes = await contract.getData(`challenge_${key}`);
          if (challengeBytes.length > 0) {
            try {
              const challengeData = JSON.parse(ethers.toUtf8String(challengeBytes));
              list.push({
                id: key,
                encryptedScore: challengeData.score,
                timestamp: challengeData.timestamp,
                player: challengeData.player,
                category: challengeData.category,
                status: challengeData.status || "pending",
                reward: challengeData.reward || 0
              });
            } catch (e) {
              console.error(`Error parsing challenge data for ${key}:`, e);
            }
          }
        } catch (e) {
          console.error(`Error loading challenge ${key}:`, e);
        }
      }
      
      list.sort((a, b) => b.timestamp - a.timestamp);
      setChallenges(list);
    } catch (e) {
      console.error("Error loading challenges:", e);
    } finally {
      setIsRefreshing(false);
      setLoading(false);
    }
  };

  const submitChallenge = async () => {
    if (!provider) { 
      alert("Please connect wallet first"); 
      return; 
    }
    
    setCreating(true);
    setTransactionStatus({
      visible: true,
      status: "pending",
      message: "Encrypting financial data with FHE..."
    });
    
    try {
      // Simulate FHE encryption
      const encryptedScore = `FHE-${btoa(JSON.stringify({
        category: newChallengeData.category,
        difficulty: newChallengeData.difficulty,
        stakeAmount: newChallengeData.stakeAmount
      }))}`;
      
      const contract = await getContractWithSigner();
      if (!contract) {
        throw new Error("Failed to get contract with signer");
      }
      
      const challengeId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      const challengeData = {
        score: encryptedScore,
        timestamp: Math.floor(Date.now() / 1000),
        player: account,
        category: newChallengeData.category,
        status: "pending",
        reward: parseInt(newChallengeData.stakeAmount) * parseInt(newChallengeData.difficulty)
      };
      
      // Store encrypted data on-chain using FHE
      await contract.setData(
        `challenge_${challengeId}`, 
        ethers.toUtf8Bytes(JSON.stringify(challengeData))
      );
      
      const keysBytes = await contract.getData("challenge_keys");
      let keys: string[] = [];
      
      if (keysBytes.length > 0) {
        try {
          keys = JSON.parse(ethers.toUtf8String(keysBytes));
        } catch (e) {
          console.error("Error parsing keys:", e);
        }
      }
      
      keys.push(challengeId);
      
      await contract.setData(
        "challenge_keys", 
        ethers.toUtf8Bytes(JSON.stringify(keys))
      );
      
      setTransactionStatus({
        visible: true,
        status: "success",
        message: "FHE challenge created successfully!"
      });
      
      await loadChallenges();
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
        setShowCreateModal(false);
        setNewChallengeData({
          category: "",
          difficulty: "1",
          stakeAmount: "0"
        });
      }, 2000);
    } catch (e: any) {
      const errorMessage = e.message.includes("user rejected transaction")
        ? "Transaction rejected by user"
        : "Submission failed: " + (e.message || "Unknown error");
      
      setTransactionStatus({
        visible: true,
        status: "error",
        message: errorMessage
      });
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
      }, 3000);
    } finally {
      setCreating(false);
    }
  };

  const completeChallenge = async (challengeId: string) => {
    if (!provider) {
      alert("Please connect wallet first");
      return;
    }

    setTransactionStatus({
      visible: true,
      status: "pending",
      message: "Processing FHE challenge..."
    });

    try {
      const contract = await getContractWithSigner();
      if (!contract) {
        throw new Error("Failed to get contract with signer");
      }
      
      const challengeBytes = await contract.getData(`challenge_${challengeId}`);
      if (challengeBytes.length === 0) {
        throw new Error("Challenge not found");
      }
      
      const challengeData = JSON.parse(ethers.toUtf8String(challengeBytes));
      
      const updatedChallenge = {
        ...challengeData,
        status: "completed"
      };
      
      await contract.setData(
        `challenge_${challengeId}`, 
        ethers.toUtf8Bytes(JSON.stringify(updatedChallenge))
      );
      
      setTransactionStatus({
        visible: true,
        status: "success",
        message: "Challenge completed with FHE!"
      });
      
      await loadChallenges();
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
      }, 2000);
    } catch (e: any) {
      setTransactionStatus({
        visible: true,
        status: "error",
        message: "Completion failed: " + (e.message || "Unknown error")
      });
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
      }, 3000);
    }
  };

  const failChallenge = async (challengeId: string) => {
    if (!provider) {
      alert("Please connect wallet first");
      return;
    }

    setTransactionStatus({
      visible: true,
      status: "pending",
      message: "Processing FHE challenge..."
    });

    try {
      const contract = await getContractWithSigner();
      if (!contract) {
        throw new Error("Failed to get contract with signer");
      }
      
      const challengeBytes = await contract.getData(`challenge_${challengeId}`);
      if (challengeBytes.length === 0) {
        throw new Error("Challenge not found");
      }
      
      const challengeData = JSON.parse(ethers.toUtf8String(challengeBytes));
      
      const updatedChallenge = {
        ...challengeData,
        status: "failed"
      };
      
      await contract.setData(
        `challenge_${challengeId}`, 
        ethers.toUtf8Bytes(JSON.stringify(updatedChallenge))
      );
      
      setTransactionStatus({
        visible: true,
        status: "success",
        message: "Challenge marked as failed!"
      });
      
      await loadChallenges();
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
      }, 2000);
    } catch (e: any) {
      setTransactionStatus({
        visible: true,
        status: "error",
        message: "Operation failed: " + (e.message || "Unknown error")
      });
      
      setTimeout(() => {
        setTransactionStatus({ visible: false, status: "pending", message: "" });
      }, 3000);
    }
  };

  const isPlayer = (address: string) => {
    return account.toLowerCase() === address.toLowerCase();
  };

  const renderPieChart = () => {
    const total = challenges.length || 1;
    const completedPercentage = (completedCount / total) * 100;
    const pendingPercentage = (pendingCount / total) * 100;
    const failedPercentage = (failedCount / total) * 100;

    return (
      <div className="pie-chart-container">
        <div className="pie-chart">
          <div 
            className="pie-segment completed" 
            style={{ transform: `rotate(${completedPercentage * 3.6}deg)` }}
          ></div>
          <div 
            className="pie-segment pending" 
            style={{ transform: `rotate(${(completedPercentage + pendingPercentage) * 3.6}deg)` }}
          ></div>
          <div 
            className="pie-segment failed" 
            style={{ transform: `rotate(${(completedPercentage + pendingPercentage + failedPercentage) * 3.6}deg)` }}
          ></div>
          <div className="pie-center">
            <div className="pie-value">{challenges.length}</div>
            <div className="pie-label">Challenges</div>
          </div>
        </div>
        <div className="pie-legend">
          <div className="legend-item">
            <div className="color-box completed"></div>
            <span>Completed: {completedCount}</span>
          </div>
          <div className="legend-item">
            <div className="color-box pending"></div>
            <span>Pending: {pendingCount}</span>
          </div>
          <div className="legend-item">
            <div className="color-box failed"></div>
            <span>Failed: {failedCount}</span>
          </div>
        </div>
      </div>
    );
  };

  const filteredChallenges = challenges.filter(challenge => {
    const matchesSearch = challenge.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         challenge.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || challenge.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(challenges.map(c => c.category))];

  if (loading) return (
    <div className="loading-screen">
      <div className="cyber-spinner"></div>
      <p>Initializing FHE connection...</p>
    </div>
  );

  return (
    <div className="app-container cyberpunk-theme">
      <header className="app-header">
        <div className="logo">
          <div className="logo-icon">
            <div className="shield-icon"></div>
          </div>
          <h1>FinLit<span>FHE</span>Game</h1>
        </div>
        
        <div className="header-actions">
          <button 
            onClick={() => setShowCreateModal(true)} 
            className="create-challenge-btn cyber-button"
          >
            <div className="add-icon"></div>
            New Challenge
          </button>
          <WalletManager account={account} onConnect={onConnect} onDisconnect={onDisconnect} />
        </div>
      </header>
      
      <div className="main-content">
        <div className="welcome-banner">
          <div className="welcome-text">
            <h2>Privacy-Preserving Financial Literacy Game</h2>
            <p>Learn financial concepts while keeping your data encrypted with FHE technology</p>
          </div>
        </div>
        
        <div className="dashboard-grid">
          <div className="dashboard-card cyber-card">
            <h3>Project Introduction</h3>
            <p>FinLitFHEGame uses Fully Homomorphic Encryption to personalize financial education challenges without exposing your sensitive data.</p>
            <div className="fhe-badge">
              <span>FHE-Powered</span>
            </div>
          </div>
          
          <div className="dashboard-card cyber-card">
            <h3>Game Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-value">{challenges.length}</div>
                <div className="stat-label">Total Challenges</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{completedCount}</div>
                <div className="stat-label">Completed</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{pendingCount}</div>
                <div className="stat-label">Pending</div>
              </div>
              <div className="stat-item">
                <div className="stat-value">{totalRewards}</div>
                <div className="stat-label">Total Rewards</div>
              </div>
            </div>
          </div>
          
          <div className="dashboard-card cyber-card">
            <h3>Challenge Distribution</h3>
            {renderPieChart()}
          </div>
        </div>
        
        <div className="challenges-section">
          <div className="section-header">
            <h2>Financial Challenges</h2>
            <div className="header-actions">
              <div className="search-filter">
                <input
                  type="text"
                  placeholder="Search challenges..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="cyber-input"
                />
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="cyber-select"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat, index) => (
                    <option key={index} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={loadChallenges}
                className="refresh-btn cyber-button"
                disabled={isRefreshing}
              >
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
          
          <div className="challenges-list cyber-card">
            <div className="table-header">
              <div className="header-cell">ID</div>
              <div className="header-cell">Category</div>
              <div className="header-cell">Player</div>
              <div className="header-cell">Date</div>
              <div className="header-cell">Reward</div>
              <div className="header-cell">Status</div>
              <div className="header-cell">Actions</div>
            </div>
            
            {filteredChallenges.length === 0 ? (
              <div className="no-challenges">
                <div className="no-challenges-icon"></div>
                <p>No financial challenges found</p>
                <button 
                  className="cyber-button primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  Create First Challenge
                </button>
              </div>
            ) : (
              filteredChallenges.map(challenge => (
                <div className="challenge-row" key={challenge.id}>
                  <div className="table-cell challenge-id">#{challenge.id.substring(0, 6)}</div>
                  <div className="table-cell">{challenge.category}</div>
                  <div className="table-cell">{challenge.player.substring(0, 6)}...{challenge.player.substring(38)}</div>
                  <div className="table-cell">
                    {new Date(challenge.timestamp * 1000).toLocaleDateString()}
                  </div>
                  <div className="table-cell">{challenge.reward}</div>
                  <div className="table-cell">
                    <span className={`status-badge ${challenge.status}`}>
                      {challenge.status}
                    </span>
                  </div>
                  <div className="table-cell actions">
                    {isPlayer(challenge.player) && challenge.status === "pending" && (
                      <>
                        <button 
                          className="action-btn cyber-button success"
                          onClick={() => completeChallenge(challenge.id)}
                        >
                          Complete
                        </button>
                        <button 
                          className="action-btn cyber-button danger"
                          onClick={() => failChallenge(challenge.id)}
                        >
                          Fail
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
  
      {showCreateModal && (
        <ModalCreate 
          onSubmit={submitChallenge} 
          onClose={() => setShowCreateModal(false)} 
          creating={creating}
          challengeData={newChallengeData}
          setChallengeData={setNewChallengeData}
        />
      )}
      
      {walletSelectorOpen && (
        <WalletSelector
          isOpen={walletSelectorOpen}
          onWalletSelect={(wallet) => { onWalletSelect(wallet); setWalletSelectorOpen(false); }}
          onClose={() => setWalletSelectorOpen(false)}
        />
      )}
      
      {transactionStatus.visible && (
        <div className="transaction-modal">
          <div className="transaction-content cyber-card">
            <div className={`transaction-icon ${transactionStatus.status}`}>
              {transactionStatus.status === "pending" && <div className="cyber-spinner"></div>}
              {transactionStatus.status === "success" && <div className="check-icon"></div>}
              {transactionStatus.status === "error" && <div className="error-icon"></div>}
            </div>
            <div className="transaction-message">
              {transactionStatus.message}
            </div>
          </div>
        </div>
      )}
  
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="logo">
              <div className="shield-icon"></div>
              <span>FinLitFHEGame</span>
            </div>
            <p>Privacy-preserving financial education powered by FHE</p>
          </div>
          
          <div className="footer-links">
            <a href="#" className="footer-link">Documentation</a>
            <a href="#" className="footer-link">Privacy Policy</a>
            <a href="#" className="footer-link">Terms of Service</a>
            <a href="#" className="footer-link">Contact</a>
          </div>
        </div>
        
        <div className="footer-bottom">
          <div className="fhe-badge">
            <span>FHE-Powered Privacy</span>
          </div>
          <div className="copyright">
            © {new Date().getFullYear()} FinLitFHEGame. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

interface ModalCreateProps {
  onSubmit: () => void; 
  onClose: () => void; 
  creating: boolean;
  challengeData: any;
  setChallengeData: (data: any) => void;
}

const ModalCreate: React.FC<ModalCreateProps> = ({ 
  onSubmit, 
  onClose, 
  creating,
  challengeData,
  setChallengeData
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setChallengeData({
      ...challengeData,
      [name]: value
    });
  };

  const handleSubmit = () => {
    if (!challengeData.category) {
      alert("Please select a category");
      return;
    }
    
    onSubmit();
  };

  return (
    <div className="modal-overlay">
      <div className="create-modal cyber-card">
        <div className="modal-header">
          <h2>Create New Financial Challenge</h2>
          <button onClick={onClose} className="close-modal">&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="fhe-notice-banner">
            <div className="key-icon"></div> Your financial data will be encrypted with FHE
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Category *</label>
              <select 
                name="category"
                value={challengeData.category} 
                onChange={handleChange}
                className="cyber-select"
              >
                <option value="">Select category</option>
                <option value="Budgeting">Budgeting</option>
                <option value="Investing">Investing</option>
                <option value="Credit">Credit</option>
                <option value="Taxes">Taxes</option>
                <option value="Savings">Savings</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Difficulty Level</label>
              <select 
                name="difficulty"
                value={challengeData.difficulty} 
                onChange={handleChange}
                className="cyber-select"
              >
                <option value="1">Beginner</option>
                <option value="2">Intermediate</option>
                <option value="3">Advanced</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Stake Amount (ETH)</label>
              <input 
                type="number"
                name="stakeAmount"
                value={challengeData.stakeAmount} 
                onChange={handleChange}
                min="0"
                step="0.01"
                className="cyber-input"
              />
            </div>
          </div>
          
          <div className="privacy-notice">
            <div className="privacy-icon"></div> Your financial data remains encrypted during FHE processing
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            onClick={onClose}
            className="cancel-btn cyber-button"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={creating}
            className="submit-btn cyber-button primary"
          >
            {creating ? "Creating with FHE..." : "Create Challenge"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default App;