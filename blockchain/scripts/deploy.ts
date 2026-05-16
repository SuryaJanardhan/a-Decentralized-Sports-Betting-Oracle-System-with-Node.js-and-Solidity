import { ethers } from "hardhat";

async function main() {
  console.log("Deploying contracts...");

  const SportsOracle = await ethers.getContractFactory("SportsOracle");
  const oracle = await SportsOracle.deploy();
  await oracle.waitForDeployment();
  const oracleAddress = await oracle.getAddress();

  console.log(`SportsOracle deployed to: ${oracleAddress}`);

  const BettingMarket = await ethers.getContractFactory("BettingMarket");
  const bettingMarket = await BettingMarket.deploy(oracleAddress);
  await bettingMarket.waitForDeployment();
  const bettingMarketAddress = await bettingMarket.getAddress();

  console.log(`BettingMarket deployed to: ${bettingMarketAddress}`);

  // Transfer some ETH to BettingMarket for payouts (optional for initial setup)
  const [deployer] = await ethers.getSigners();
  await deployer.sendTransaction({
    to: bettingMarketAddress,
    value: ethers.parseEther("1.0"),
  });
  console.log("Sent 1.0 ETH to BettingMarket for payouts");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
