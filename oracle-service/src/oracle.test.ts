import { OracleService } from './oracle';
import { ethers } from 'ethers';

jest.mock('ethers', () => {
  return {
    ethers: {
      JsonRpcProvider: jest.fn().mockImplementation(() => ({
        // Mock any provider methods used
      })),
      Wallet: jest.fn().mockImplementation(() => ({
        // Mock any wallet methods used
      })),
      Contract: jest.fn().mockImplementation(() => ({
        submitPlayerData: jest.fn().mockResolvedValue({
          wait: jest.fn().mockResolvedValue({ hash: '0x123' }),
        }),
        finalizeMatch: jest.fn().mockResolvedValue({
          wait: jest.fn().mockResolvedValue({ hash: '0x456' }),
        }),
      })),
    },
    // Also mock individual exports if used
    JsonRpcProvider: jest.fn().mockImplementation(() => ({})),
    Wallet: jest.fn().mockImplementation(() => ({})),
    Contract: jest.fn().mockImplementation(() => ({
      submitPlayerData: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({ hash: '0x123' }),
      }),
      finalizeMatch: jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({ hash: '0x456' }),
      }),
    })),
  };
});

describe('OracleService', () => {
  let oracleService: OracleService;

  beforeEach(() => {
    oracleService = new OracleService('http://localhost:8545', '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80', '0x5FbDB2315678afecb367f032d93F642f64180aa3');
  });

  it('should submit player data', async () => {
    const txHash = await oracleService.submitPlayerData(1, 101, 25);
    expect(txHash).toBe('0x123');
  });

  it('should finalize match', async () => {
    const txHash = await oracleService.finalizeMatch(1, 101);
    expect(txHash).toBe('0x456');
  });

  it('should throw error if contract is not initialized', async () => {
    const service = new OracleService('', '', '');
    await expect(service.submitPlayerData(1, 101, 25)).rejects.toThrow('Contract not initialized');
  });
});
