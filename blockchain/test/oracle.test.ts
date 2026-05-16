import { expect } from "chai";
import { ethers } from "hardhat";
import { SportsOracle } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SportsOracle", function () {
  let oracle: SportsOracle;
  let owner: SignerWithAddress;
  let otherAccount: SignerWithAddress;

  beforeEach(async function () {
    [owner, otherAccount] = await ethers.getSigners();
    const SportsOracle = await ethers.getContractFactory("SportsOracle");
    oracle = await SportsOracle.deploy();
  });

  it("Should set the right oracle address", async function () {
    expect(await oracle.oracleAddress()).to.equal(owner.address);
  });

  it("Should allow oracle to submit data", async function () {
    const matchId = 1;
    const playerId = 101;
    const pointsScored = 25;

    await expect(oracle.submitPlayerData(matchId, playerId, pointsScored))
      .to.emit(oracle, "DataSubmitted")
      .withArgs(matchId, playerId, pointsScored);

    const performance = await oracle.performances(matchId, playerId);
    expect(performance.pointsScored).to.equal(pointsScored);
    expect(performance.finalized).to.be.false;
  });

  it("Should allow oracle to finalize data", async function () {
    const matchId = 1;
    const playerId = 101;
    await oracle.submitPlayerData(matchId, playerId, 25);

    await expect(oracle.finalizeMatch(matchId, playerId))
      .to.emit(oracle, "DataFinalized")
      .withArgs(matchId, playerId);

    expect(await oracle.isFinalized(matchId, playerId)).to.be.true;
  });

  it("Should fail if non-oracle tries to submit data", async function () {
    await expect(oracle.connect(otherAccount).submitPlayerData(1, 101, 25))
      .to.be.revertedWith("Only oracle can call");
  });
});
