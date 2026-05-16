import { expect } from "chai";
import { ethers } from "hardhat";
import { SportsOracle } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SportsOracle - Comprehensive Tests", function () {
  let oracle: SportsOracle;
  let owner: SignerWithAddress;
  let otherAccount: SignerWithAddress;

  beforeEach(async function () {
    [owner, otherAccount] = await ethers.getSigners();
    const SportsOracle = await ethers.getContractFactory("SportsOracle");
    oracle = await SportsOracle.deploy();
  });

  describe("Deployment", function () {
    it("Should set the correct oracle address", async function () {
      expect(await oracle.oracleAddress()).to.equal(owner.address);
    });
  });

  describe("submitPlayerData", function () {
    it("Should allow oracle to submit data", async function () {
      const matchId = 1;
      const playerId = 101;
      const pointsScored = 25;

      await expect(oracle.submitPlayerData(matchId, playerId, pointsScored))
        .to.emit(oracle, "DataSubmitted")
        .withArgs(matchId, playerId, pointsScored);

      const performance = await oracle.performances(matchId, playerId);
      expect(performance.pointsScored).to.equal(pointsScored);
      expect(performance.exists).to.be.true;
      expect(performance.finalized).to.be.false;
    });

    it("Should fail if non-oracle tries to submit", async function () {
      await expect(oracle.connect(otherAccount).submitPlayerData(1, 101, 25))
        .to.be.revertedWith("Only oracle can call");
    });

    it("Should fail if submitting for finalized data", async function () {
      await oracle.submitPlayerData(1, 101, 25);
      await oracle.finalizeMatch(1, 101);
      await expect(oracle.submitPlayerData(1, 101, 30))
        .to.be.revertedWith("Data already finalized");
    });

    it("Should allow overwriting non-finalized data", async function () {
      await oracle.submitPlayerData(1, 101, 25);
      await oracle.submitPlayerData(1, 101, 30);
      const performance = await oracle.performances(1, 101);
      expect(performance.pointsScored).to.equal(30);
    });
  });

  describe("finalizeMatch", function () {
    it("Should allow oracle to finalize match", async function () {
      await oracle.submitPlayerData(1, 101, 25);
      await expect(oracle.finalizeMatch(1, 101))
        .to.emit(oracle, "DataFinalized")
        .withArgs(1, 101);
      
      expect(await oracle.isFinalized(1, 101)).to.be.true;
    });

    it("Should fail if data does not exist", async function () {
      await expect(oracle.finalizeMatch(999, 999))
        .to.be.revertedWith("Data does not exist");
    });

    it("Should fail if already finalized", async function () {
      await oracle.submitPlayerData(1, 101, 25);
      await oracle.finalizeMatch(1, 101);
      await expect(oracle.finalizeMatch(1, 101))
        .to.be.revertedWith("Data already finalized");
    });

    it("Should fail if non-oracle tries to finalize", async function () {
      await oracle.submitPlayerData(1, 101, 25);
      await expect(oracle.connect(otherAccount).finalizeMatch(1, 101))
        .to.be.revertedWith("Only oracle can call");
    });
  });

  describe("Edge Cases", function () {
    it("Should handle 0 points scored", async function () {
      await oracle.submitPlayerData(1, 101, 0);
      expect(await oracle.getPointsScored(1, 101)).to.equal(0);
    });

    it("Should handle large numeric IDs", async function () {
      const largeId = BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935");
      await oracle.submitPlayerData(largeId, largeId, 100);
      expect(await oracle.getPointsScored(largeId, largeId)).to.equal(100);
    });
  });
});
