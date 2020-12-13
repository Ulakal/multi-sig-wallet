const MultiSigWallet = artifacts.require("MultiSigWallet");
const { assert } = require('chai');
const chai = require('chai');
chai.use(require('chai-as-promised'));
const truffleAssert = require('truffle-assertions');


contract('MultiSigWallet', async function(accounts) {
    let wallet 
    
    before(async () => {
        //let owners = [accounts[0], accounts[1], accounts[2]]
        wallet = await MultiSigWallet.deployed()
        await wallet.deposit({from: accounts[0], value: web3.utils.toWei("3", "ether")})
    })
    describe('initializes contract correctly', async() => {
        it('initializes contract with correct values', async() => {
            let owner1 = await wallet.owners(0)
            let owner2 = await wallet.owners(1)
            let owner3 = await wallet.owners(2)
            let confirmationsRequired = await wallet.confirmationsRequired()
            
            assert.equal(owner1, accounts[0], 'first owner is not correct')
            assert.equal(owner2, accounts[1], 'second owner is not correct')
            assert.equal(owner3, accounts[2], 'third owner is not correct')
            assert.equal(confirmationsRequired, 2, 'wrong number of confirmations')
        })
        it('should reject if no owners', async() => {
            await truffleAssert.fails(MultiSigWallet.new([], 2)), truffleAssert.ErrorType.REVERT 
        })
        it('should reject if confirmations required number is incorrect', async() => {
            await truffleAssert.fails(MultiSigWallet.new([accounts[0], accounts[1], accounts[2]], 0)), truffleAssert.ErrorType.REVERT 
            await truffleAssert.fails(MultiSigWallet.new([accounts[0], accounts[1], accounts[2]], 4)), truffleAssert.ErrorType.REVERT 
        })
    })
    
    describe('submits transaction correctly', async() => {
        it('creates transaction correctly', async() => {
            let to = accounts[3]    
            let value = web3.utils.toWei("1", "ether")
            let data = "0x0123"
            //submit tx
            let result = await wallet.submitTransaction(to, value, data, {from: accounts[0]})
            
            let tx = await wallet.transactions(0)
            //check if tx is created correctly
            assert.equal(tx.to, to, 'receiver is incorrect')
            assert.equal(tx.value, value, 'value is incorrect')
            assert.equal(tx.data, data, 'data is incorrect')
            //check if event is created correctly
            let event = result.logs[1]
            assert.equal(event.args.txIndex, 0, 'wrong tx index')
            assert.equal(event.args.creator, accounts[0], 'wrong tx creator')
            assert.equal(event.args.to, accounts[3], 'wrong receiver')
            assert.equal(event.args.value.toString(), value, 'wrong tx value')
        })
        it('non owner cannot submit transaction', async() => {
            let value = web3.utils.toWei("1", "ether")
            await truffleAssert.fails(wallet.submitTransaction(accounts[3], value, 0x00, {from: accounts[3]})), truffleAssert.ErrorType.REVERT 
        })
    })
    describe('confirms transaction correctly', async() => {
        it('non owner cannot confirm tx', async() => {
            await truffleAssert.fails(wallet.confirmTransaction(0)), truffleAssert.ErrorType.REVERT
        })
        it('cannot confirm tx which doesnt exist', async() => {
            await truffleAssert.fails(wallet.confirmTransaction(1)), truffleAssert.ErrorType.REVERT
        })
        it('cannot confirm transaction already confirmed', async() => {
            await truffleAssert.fails(wallet.confirmTransaction(0, {from: accounts[0]})), truffleAssert.ErrorType.REVERT
        })
        it('confirms tx correctly and adds confirmation correctly', async() => {
            let txBefore = await wallet.transactions(0)
            let result = await wallet.confirmTransaction(0, {from: accounts[1]})
            let txAfter = await wallet.transactions(0)
            assert.equal(txAfter.confirmationsNr.toNumber(), txBefore.confirmationsNr.toNumber() + 1)

            let event = result.logs[0]
            assert.equal(event.args.txIndex, 0)
            assert.equal(event.args.confirmedBy, accounts[1])
        })
    })
    describe('revokes confirmations correctly', async() => {
        it('cannot revoke confirmation which wasnt confirmed by user', async() => {
            await truffleAssert.fails(wallet.revokeConfirmation(0, {from: accounts[2]})), truffleAssert.ErrorType.REVERT
        })
        it('revokes confirmation correctly', async() => {
            await truffleAssert.passes(wallet.revokeConfirmation(0, {from: accounts[0]}))
            await wallet.confirmTransaction(0, {from: accounts[0]})
        })
    })
    describe('executes transaction correctly', async() => {
        it('non owner cannot execute tx', async() => {
            await truffleAssert.fails(wallet.executeTransaction(0, {from: accounts[3]})), truffleAssert.ErrorType.REVERT
        })
        it('executes transaction correctly', async() => {
            let result = await wallet.executeTransaction(0, {from: accounts[0]})
            let tx = await wallet.transactions(0)
            assert.equal(tx.executed, true)

            let event = result.logs[0]
            assert.equal(event.args.to, accounts[3])
            assert.equal(event.args.value.toString(), web3.utils.toWei("1", "ether"))
            assert.equal(event.args.executedBy, accounts[0])
        })
        it('cannot confirm already executed tx', async() => {
            await truffleAssert.fails(wallet.confirmTransaction(0, {from: accounts[2]}))
        })
    })
})