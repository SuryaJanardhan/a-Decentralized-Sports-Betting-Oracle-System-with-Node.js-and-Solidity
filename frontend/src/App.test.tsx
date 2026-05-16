import { render, screen, fireEvent, configure } from '@testing-library/react';
import App from './App';
import { expect, vi, it, describe } from 'vitest';

// Configure RTL to use data-test-id
configure({ testIdAttribute: 'data-test-id' });

// Mock ethers
vi.mock('ethers', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    BrowserProvider: vi.fn().mockImplementation(() => ({
      getSigner: vi.fn().mockResolvedValue({
        getAddress: vi.fn().mockResolvedValue('0x123'),
      }),
    })),
    Contract: vi.fn().mockImplementation(() => ({
      nextBetId: vi.fn().mockResolvedValue(0n),
      bets: vi.fn().mockResolvedValue({
        bettor: '0x123',
        amount: 1000000000000000000n,
        matchId: 1n,
        playerId: 101n,
        predictedValue: 25n,
        settled: false,
      }),
    })),
  };
});

// Mock window.ethereum
global.window.ethereum = {
  request: vi.fn().mockResolvedValue(['0x123']),
} as any;

describe('App Component', () => {
  it('renders correctly', () => {
    render(<App />);
    expect(screen.getAllByText(/BetOracle/i)[0]).toBeInTheDocument();
    expect(screen.getByTestId('connect-wallet-button')).toBeInTheDocument();
  });

  it('triggers wallet connection', async () => {
    render(<App />);
    const connectButton = screen.getByTestId('connect-wallet-button');
    fireEvent.click(connectButton);
    
    const userAddress = await screen.findByTestId('user-address');
    expect(userAddress).toBeInTheDocument();
    expect(userAddress.textContent).toContain('0x123');
  });

  it('displays market information', () => {
    render(<App />);
    expect(screen.getByText(/Lakers vs Warriors/i)).toBeInTheDocument();
    expect(screen.getByText(/LeBron James/i)).toBeInTheDocument();
  });

  it('contains place bet button with correct data-test-id', () => {
    render(<App />);
    expect(screen.getByTestId('place-bet-button-1-101')).toBeInTheDocument();
  });
});
