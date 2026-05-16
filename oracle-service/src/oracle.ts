import { ethers } from 'ethers';

const ORACLE_ABI = [
  "function submitPlayerData(uint256 matchId, uint256 playerId, uint256 pointsScored) external",
  "function finalizeMatch(uint256 matchId, uint256 playerId) external"
];

export class OracleService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | null = null;
  private contract: ethers.Contract | null = null;

  constructor(rpcUrl: string, privateKey: string, contractAddress: string) {
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    if (privateKey && contractAddress) {
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      this.contract = new ethers.Contract(contractAddress, ORACLE_ABI, this.wallet);
    }
  }

  async submitPlayerData(matchId: number, playerId: number, pointsScored: number) {
    if (!this.contract) throw new Error("Contract not initialized");
    
    console.log(`Submitting data: match ${matchId}, player ${playerId}, points ${pointsScored}`);
    const tx = await this.contract.submitPlayerData(matchId, playerId, pointsScored);
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async finalizeMatch(matchId: number, playerId: number) {
    if (!this.contract) throw new Error("Contract not initialized");
    
    console.log(`Finalizing match: match ${matchId}, player ${playerId}`);
    const tx = await this.contract.finalizeMatch(matchId, playerId);
    const receipt = await tx.wait();
    return receipt.hash;
  }
}
