const MultiSigWallet = artifacts.require("MultiSigWallet");
//const { assert } = require('chai');
//const chai = require('chai');
//chai.use(require('chai-as-promised'));
//const truffleAssert = require('truffle-assertions');

contract('MultiSigWallet', async function(accounts) {
    let wallet

    before(async () => {
        //let owners = [accounts[0], accounts[1], accounts[2]]
        wallet = await MultiSigWallet.deployed()
        await wallet.deposit({from: accounts[0], value: web3.utils.toWei("3", "ether")})
    })

    it('adds new owner correctly', async() => {
        let addOwnerData = await web3.eth.abi.encodeFunctionCall({
        name: 'addOwner',
        type: 'function',
        inputs: [{
            type: 'address',
            name: '_newOwner'
        }]}, ['0xa748B7f6dD59e5b23BFfAEd1477E7222f63c980D']);
        console.log(addOwnerData);

        let to = wallet.address
        console.log(to)
        let result = await wallet.submitTransaction(to, 0, addOwnerData, {from: accounts[0]})
        
        let confirmation = await wallet.confirmTransaction(0, {from: accounts[1]})
        await wallet.confirmTransaction(0, {from: accounts[2]})
        
        let check = await wallet.isOwner('0xa748B7f6dD59e5b23BFfAEd1477E7222f63c980D')
        console.log(check)

        await wallet.executeTransaction(0, {from: accounts[0]})
        let checkAfter = await wallet.isOwner('0xa748B7f6dD59e5b23BFfAEd1477E7222f63c980D')
        console.log(checkAfter)
    })
})