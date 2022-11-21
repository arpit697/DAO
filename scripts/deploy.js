const hre = require("hardhat");

async function main() {
  [addr1, addr2, addr3, addr4] = await ethers.getSigners();
  const DAO = await hre.ethers.getContractFactory("DAO");
  const dao = await DAO.deploy([addr2.address , addr3.address , addr4.address], 51);
  console.log(dao.address);
  await dao.deployed();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

//npx hardhat run scripts/deploy.js --network goerli
