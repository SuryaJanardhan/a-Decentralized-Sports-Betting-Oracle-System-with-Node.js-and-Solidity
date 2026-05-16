import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Wallet, Trophy, Activity, Send, CheckCircle2, History, TrendingUp, ShieldCheck } from 'lucide-react';

// ABIs
const ORACLE_ABI = [
  "function isFinalized(uint256 matchId, uint256 playerId) external view returns (bool)",
  "function getPointsScored(uint256 matchId, uint256 playerId) external view returns (uint256)"
];

const BETTING_MARKET_ABI = [
  "function placeBet(uint256 matchId, uint256 playerId, uint256 predictedValue) external payable",
  "function settleBet(uint256 betId) external",
  "function nextBetId() external view returns (uint256)",
  "function bets(uint256) external view returns (address bettor, uint256 amount, uint256 matchId, uint256 playerId, uint256 predictedValue, bool settled, bool exists)"
];

const BETTING_MARKET_ADDRESS = "0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9";

interface Bet {
  id: number;
  amount: string;
  matchId: number;
  playerId: number;
  predictedValue: number;
  settled: boolean;
}

function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [betAmount, setBetAmount] = useState("0.1");
  const [userBets, setUserBets] = useState<Bet[]>([]);
  const [loading, setLoading] = useState(false);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
        const browserProvider = new ethers.BrowserProvider(window.ethereum);
        setProvider(browserProvider);
        fetchUserBets(browserProvider, accounts[0]);
      } catch (error) {
        console.error("User denied account access");
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const fetchUserBets = async (p: ethers.BrowserProvider, acc: string) => {
    try {
      const contract = new ethers.Contract(BETTING_MARKET_ADDRESS, BETTING_MARKET_ABI, p);
      const nextId = await contract.nextBetId();
      const bets: Bet[] = [];
      for (let i = 0; i < Number(nextId); i++) {
        const b = await contract.bets(i);
        if (b.bettor.toLowerCase() === acc.toLowerCase()) {
          bets.push({
            id: i,
            amount: ethers.formatEther(b.amount),
            matchId: Number(b.matchId),
            playerId: Number(b.playerId),
            predictedValue: Number(b.predictedValue),
            settled: b.settled
          });
        }
      }
      setUserBets(bets);
    } catch (error) {
      console.error("Error fetching bets:", error);
    }
  };

  const placeBet = async (matchId: number, playerId: number, predictedValue: number) => {
    if (!provider || !account) return;
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(BETTING_MARKET_ADDRESS, BETTING_MARKET_ABI, signer);
      const tx = await contract.placeBet(matchId, playerId, predictedValue, {
        value: ethers.parseEther(betAmount)
      });
      await tx.wait();
      alert("Bet placed successfully!");
      fetchUserBets(provider, account);
    } catch (error: any) {
      console.error(error);
      alert("Error: " + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  const settleBet = async (betId: number) => {
    if (!provider || !account) return;
    setLoading(true);
    try {
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(BETTING_MARKET_ADDRESS, BETTING_MARKET_ABI, signer);
      const tx = await contract.settleBet(betId);
      await tx.wait();
      alert("Bet settled!");
      fetchUserBets(provider, account);
    } catch (error: any) {
      console.error(error);
      alert("Error: " + (error.reason || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-right from-primary via-secondary to-accent" />
      
      <header className="max-w-7xl mx-auto px-6 py-8 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">BetOracle</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold">Decentralized Sports</p>
          </div>
        </div>

        {!account ? (
          <button 
            data-test-id="connect-wallet-button"
            onClick={connectWallet}
            className="group relative flex items-center gap-2 px-8 py-3 rounded-xl bg-primary hover:bg-primary/90 transition-all font-bold shadow-2xl shadow-primary/20 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Wallet className="w-5 h-5" />
            Connect Wallet
          </button>
        ) : (
          <div className="flex items-center gap-4">
             <div className="hidden sm:flex flex-col items-end">
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Connected Wallet</span>
                <span data-test-id="user-address" className="font-mono text-sm text-primary">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
             </div>
             <div className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-primary" />
             </div>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Betting Markets */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-center justify-between">
             <h2 className="text-3xl font-bold flex items-center gap-3">
                <TrendingUp className="text-primary" />
                Live Markets
             </h2>
             <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20">NBA</span>
                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-bold border border-blue-500/20">NFL</span>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass p-8 group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <Activity className="w-20 h-20" />
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">Lakers vs Warriors</h3>
                <span className="text-xs text-gray-500 font-mono">MATCH_ID: 1 • NBA</span>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                   <span className="text-gray-400 text-sm">Target Player</span>
                   <span className="font-bold">LeBron James</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/5 pb-2">
                   <span className="text-gray-400 text-sm">Prediction</span>
                   <span className="font-bold text-accent">Over 25.5 Points</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex gap-2">
                   <input 
                    type="number" 
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 focus:border-primary outline-none transition-all font-mono"
                    placeholder="Amount (ETH)"
                  />
                  <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-bold text-xs flex items-center">ETH</div>
                </div>
                
                <button 
                  data-test-id="place-bet-button-1-101"
                  disabled={loading || !account}
                  onClick={() => placeBet(1, 101, 25)}
                  className="w-full py-4 rounded-xl bg-white text-black hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold flex items-center justify-center gap-2 shadow-xl"
                >
                  {loading ? <Activity className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  Place Over Bet
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* User Bets / Sidebar */}
        <div className="lg:col-span-4 space-y-8">
           <div className="glass p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                 <History className="w-5 h-5 text-secondary" />
                 My Active Bets
              </h2>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {userBets.length === 0 ? (
                  <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                     <p className="text-gray-500 text-sm">No active bets found</p>
                  </div>
                ) : (
                  userBets.map(bet => (
                    <div key={bet.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
                       <div className="flex justify-between items-start mb-3">
                          <span className="text-[10px] text-gray-500 font-mono">ID: #{bet.id}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${bet.settled ? 'bg-gray-500/20 text-gray-400' : 'bg-primary/20 text-primary animate-pulse'}`}>
                             {bet.settled ? 'SETTLED' : 'ACTIVE'}
                          </span>
                       </div>
                       <p className="text-sm font-bold mb-1">Over {bet.predictedValue}.5 Points</p>
                       <p className="text-xs text-gray-400 mb-4">{bet.amount} ETH</p>
                       
                       {!bet.settled && (
                         <button 
                          onClick={() => settleBet(bet.id)}
                          className="w-full py-2 rounded-lg bg-secondary/20 hover:bg-secondary text-secondary hover:text-white transition-all text-xs font-bold"
                         >
                           Settle Bet
                         </button>
                       )}
                    </div>
                  ))
                )}
              </div>
           </div>

           <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-white/10">
              <h4 className="font-bold mb-2">Oracle Finalization</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Bets can only be settled after the Oracle service has finalized the match results. 
                Check the Oracle service logs for status updates.
              </p>
           </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 text-center">
         <p className="text-gray-500 text-xs">© 2026 BetOracle System • Built for Decentralized Sports Integrity</p>
      </footer>
    </div>
  );
}

export default App;
