const fetch = require('fetch')
const contract = require('truffle-contract')

const HashBountiesContract = require('../build/contracts/HashBounties.json')

const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:7545'))

const BN = web3.utils.BN

const hashBountyerContract = contract(HashBountiesContract)
hashBountyerContract.setProvider(web3.currentProvider)

if (typeof hashBountyerContract.currentProvider.sendAsync !== "function") {
    hashBountyerContract.currentProvider.sendAsync = function () {
        return hashBountyerContract.currentProvider.send.apply(
            hashBountyerContract.currentProvider, arguments
        );
    };
}

const inputBytes = "0x19af5e7a09875927cdec8900a5b4ce1e428b6746836586ea6838d1cf5a0271152052d7e775c9b3a5d8ebf40e2be3be234707816a758b6eec1ba28c54a4b6cf63de200008010994fb7a49c0f5f4b2c365e168f27701366acb3c326c11366b027eb96119140b"

web3.eth.getAccounts().then(accounts => {
    var account = accounts[0]
    var account2 = accounts[1]

    web3.eth.defaultAccount = account;

    const run = async () => {
        const deployedHashBountiesContract = await hashBountyerContract.deployed()

        const value = web3.utils.toWei('0.1', 'ether')
        const hash = web3.utils.sha3(inputBytes, { encoding: "hex" })

        const initialLength = (await deployedHashBountiesContract.getHashBountysLength()).toNumber()
        await deployedHashBountiesContract.requestHashBounty(hash, "scrypt", inputBytes, { from: account, value, gas: 470000 })
        await deployedHashBountiesContract.submitCrack(initialLength, "1234567890", { from: account2, gas: 470000 })
    }

    run()
})


