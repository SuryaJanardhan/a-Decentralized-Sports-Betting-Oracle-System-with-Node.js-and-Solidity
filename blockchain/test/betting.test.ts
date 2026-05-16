import { expect } from "chai";
import { ethers } from "hardhat";
import { SportsOracle, BettingMarket } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("BettingMarket", function () {
  let oracle: SportsOracle;
  let bettingMarket: BettingMarket;
  let owner: SignerWithAddress;
  let bettor: SignerWithAddress;

  beforeEach(async function () {
    [owner, bettor] = await ethers.getSigners();

    const SportsOracle = await ethers.getContractFactory("SportsOracle");
    oracle = await SportsOracle.deploy();

    const BettingMarket = await ethers.getContractFactory("BettingMarket");
    bettingMarket = await BettingMarket.deploy(await oracle.getAddress());

    // Fund the betting market for payouts
    await owner.sendTransaction({
      to: await bettingMarket.getAddress(),
      value: ethers.parseEther("10")
    });
  });

  it("Should allow placing a bet", async function () {
    const matchId = 1;
    const playerId = 101;
    const predictedValue = 20;
    const betAmount = ethers.parseEther("1");

    await expect(bettingMarket.connect(bettor).placeBet(matchId, playerId, predictedValue, { value: betAmount }))
      .to.emit(bettingMarket, "BetPlaced")
      .withArgs(0, bettor.address, betAmount);

    const bet = await bettingMarket.bets(0);
    expect(bet.bettor).to.equal(bettor.address);
    expect(bet.amount).to.equal(betAmount);
  });

  it("Should allow settling a winning bet", async function () {
    const matchId = 1;
    const playerId = 101;
    const predictedValue = 20;
    const betAmount = ethers.parseEther("1");

    await bettingMarket.connect(bettor).placeBet(matchId, playerId, predictedValue, { value: betAmount });

    // Submit and finalize data in oracle
    await oracle.submitPlayerData(matchId, playerId, 25);
    await oracle.finalizeMatch(matchId, playerId);

    const initialBalance = await ethers.provider.getBalance(bettor.address);
    await bettingMarket.settleBet(0);
    const finalBalance = await ethers.provider.getBalance(bettor.address);

    expect(finalBalance).to.be.gt(initialBalance);
    
    const bet = await bettingMarket.bets(0);
    expect(bet.settled).to.be.true;
  });

  it("Should revert if settling before match is finalized", async function () {
    await bettingMarket.connect(bettor).placeBet(1, 101, 20, { value: ethers.parseEther("1") });
    await expect(bettingMarket.settleBet(0)).to.be.revertedWith("Match not yet finalized");
  });
});
