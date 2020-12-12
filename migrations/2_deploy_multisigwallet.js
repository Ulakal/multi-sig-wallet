const MultiSigWallet = artifacts.require("MultiSigWallet");

module.exports = function(deployer) {
    
    deployer.deploy(MultiSigWallet, ["0x225d5dF72B1B268D147A91fa68ccfc9056C06307", "0x23C528d890aAA9c56b0BB5d12Ecb17a0EC16633E", "0x70DB5A11De6bEFbe4814b853aeC3A01F2de0e2c5"], 2);
};