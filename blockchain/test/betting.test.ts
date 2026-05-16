import { expect } from "chai";
import { ethers } from "hardhat";
import { SportsOracle, BettingMarket } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("BettingMarket - Comprehensive Tests", function () {
  let oracle: SportsOracle;
  let bettingMarket: BettingMarket;
  let owner: SignerWithAddress;
  let bettor1: SignerWithAddress;
  let bettor2: SignerWithAddress;

  beforeEach(async function () {
    [owner, bettor1, bettor2] = await ethers.getSigners();

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

  describe("placeBet", function () {
    it("Should allow placing a valid bet", async function () {
      const amount = ethers.parseEther("1");
      await expect(bettingMarket.connect(bettor1).placeBet(1, 101, 25, { value: amount }))
        .to.emit(bettingMarket, "BetPlaced")
        .withArgs(0, bettor1.address, amount);
      
      const bet = await bettingMarket.bets(0);
      expect(bet.bettor).to.equal(bettor1.address);
      expect(bet.amount).to.equal(amount);
      expect(bet.settled).to.be.false;
    });

    it("Should fail if amount is 0", async function () {
      await expect(bettingMarket.connect(bettor1).placeBet(1, 101, 25, { value: 0 }))
        .to.be.revertedWith("Bet amount must be greater than 0");
    });

    it("Should fail if match is already finalized", async function () {
      await oracle.submitPlayerData(1, 101, 20);
      await oracle.finalizeMatch(1, 101);
      
      await expect(bettingMarket.connect(bettor1).placeBet(1, 101, 25, { value: ethers.parseEther("1") }))
        .to.be.revertedWith("Match already finalized");
    });
  });

  describe("settleBet", function () {
    beforeEach(async function () {
      await bettingMarket.connect(bettor1).placeBet(1, 101, 25, { value: ethers.parseEther("1") }); // Over 25
      await bettingMarket.connect(bettor2).placeBet(1, 101, 30, { value: ethers.parseEther("1") }); // Over 30
    });

    it("Should pay out for a winning bet (Over)", async function () {
      await oracle.submitPlayerData(1, 101, 28);
      await oracle.finalizeMatch(1, 101);

      const initialBalance = await ethers.provider.getBalance(bettor1.address);
      await expect(bettingMarket.settleBet(0))
        .to.emit(bettingMarket, "BetSettled")
        .withArgs(0, true, ethers.parseEther("2"));
      
      const finalBalance = await ethers.provider.getBalance(bettor1.address);
      expect(finalBalance).to.be.gt(initialBalance);
      
      const bet = await bettingMarket.bets(0);
      expect(bet.settled).to.be.true;
    });

    it("Should mark as lost for a losing bet (Under/Equal)", async function () {
      await oracle.submitPlayerData(1, 101, 24); // Actual < Predicted
      await oracle.finalizeMatch(1, 101);

      const initialBalance = await ethers.provider.getBalance(bettor1.address);
      await expect(bettingMarket.settleBet(0))
        .to.emit(bettingMarket, "BetSettled")
        .withArgs(0, false, 0);
      
      const finalBalance = await ethers.provider.getBalance(bettor1.address);
      expect(finalBalance).to.equal(initialBalance);
      
      const bet = await bettingMarket.bets(0);
      expect(bet.settled).to.be.true;
    });

    it("Should fail if already settled", async function () {
      await oracle.submitPlayerData(1, 101, 28);
      await oracle.finalizeMatch(1, 101);
      await bettingMarket.settleBet(0);
      
      await expect(bettingMarket.settleBet(0))
        .to.be.revertedWith("Bet already settled");
    });

    it("Should fail if not finalized", async function () {
      await oracle.submitPlayerData(1, 101, 28);
      await expect(bettingMarket.settleBet(0))
        .to.be.revertedWith("Match not yet finalized");
    });

    it("Should fail if bet does not exist", async function () {
      await expect(bettingMarket.settleBet(999))
        .to.be.revertedWith("Bet does not exist");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle exact predicted value (Loss for 'Over')", async function () {
      await bettingMarket.connect(bettor1).placeBet(2, 102, 25, { value: ethers.parseEther("1") });
      const betId = 0; 
      
      await oracle.submitPlayerData(2, 102, 25);
      await oracle.finalizeMatch(2, 102);

      await expect(bettingMarket.settleBet(betId))
        .to.emit(bettingMarket, "BetSettled")
        .withArgs(betId, false, 0);
    });

    it("Should handle multiple bets by same bettor", async function () {
      await bettingMarket.connect(bettor1).placeBet(3, 103, 10, { value: ethers.parseEther("1") });
      await bettingMarket.connect(bettor1).placeBet(3, 103, 20, { value: ethers.parseEther("1") });
      
      await oracle.submitPlayerData(3, 103, 15);
      await oracle.finalizeMatch(3, 103);

      // Settle bet 0 (should win: 15 > 10)
      await expect(bettingMarket.settleBet(0))
        .to.emit(bettingMarket, "BetSettled")
        .withArgs(0, true, ethers.parseEther("2"));
      
      // Settle bet 1 (should lose: 15 < 20)
      await expect(bettingMarket.settleBet(1))
        .to.emit(bettingMarket, "BetSettled")
        .withArgs(1, false, 0);
    });
  });
});
