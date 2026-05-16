import { ethers } from "hardhat";

async function main() {
  const oracleAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const oracle = await ethers.getContractAt("SportsOracle", oracleAddress);
  
  const points = await oracle.getPointsScored(1, 101);
  const finalized = await oracle.isFinalized(1, 101);
  
  console.log("Match 1, Player 101 Data:");
  console.log("- Points Scored:", points.toString());
  console.log("- Finalized:", finalized);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
