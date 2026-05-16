import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import { OracleService } from './oracle';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';
const privateKey = process.env.ORACLE_PRIVATE_KEY;
const contractAddress = process.env.ORACLE_CONTRACT_ADDRESS;

if (!privateKey || !contractAddress) {
  console.warn('ORACLE_PRIVATE_KEY or ORACLE_CONTRACT_ADDRESS not set. Oracle service will run in limited mode.');
}

const oracleService = new OracleService(rpcUrl, privateKey as string, contractAddress as string);

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

app.post('/api/trigger-update', async (req, res) => {
  const { matchId, playerId, pointsScored } = req.body;
  try {
    const txHash = await oracleService.submitPlayerData(matchId, playerId, pointsScored);
    res.json({ success: true, txHash });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/trigger-finalize', async (req, res) => {
  const { matchId, playerId } = req.body;
  try {
    const txHash = await oracleService.finalizeMatch(matchId, playerId);
    res.json({ success: true, txHash });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Oracle service listening at http://localhost:${port}`);
});
