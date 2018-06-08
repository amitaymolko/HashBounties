
var HashBounties = artifacts.require("./HashBounties.sol");

require('dotenv').config({ path: '../.env' })

const ORACLE_FROM_ADDRESS = process.env.ORACLE_FROM_ADDRESS

module.exports = async (deployer, network, accounts) => {
  let oracle

  if (network == 'development') {
    oracle = accounts[2]
  } else {
    oracle = ORACLE_FROM_ADDRESS
  }
  
  deployer.deploy(HashBounties, oracle)
};
