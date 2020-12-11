pragma solidity 0.5.8;

contract MultiSigWallet {
    address[] public owners;
    uint confirmationsNumber;

    struct Transaction {
        address payable to;
        uint256 value;
        bytes data;
        bool executed;
        mapping(address => bool) isConfirmed;
        uint confirmationsNr;
    }

    Transaction[] public transactions;

    mapping(address => bool) public isOwner;

    modifier onlyOwner() {
        require(isOwner[msg.sender] == true);
        _;
    }

    event TransactionSubmitted(uint256 txIndex, address creator, address to, uint256 value);

    constructor(address[] memory _owners, uint _confirmationsNumber) public {
        require(_owners.length > 0, 'owners required');

        for (uint i=0; i < _owners.length; i++) {
            require(_owners[i] != address(0), 'invalid owner');
            require(isOwner[_owners[i]] == false, 'owner already exists' );
            
            address owner = _owners[i];
            isOwner[owner] = true;
            owners.push(owner);
        }

        confirmationsNumber = _confirmationsNumber;
    }

    function submitTransaction(address payable _to, uint256 _value, bytes memory _data) public onlyOwner {
        
        uint256 _txIndex = transactions.length;
        
        transactions.push(Transaction({
            to: _to,
            value: _value,
            data: _data,
            executed: false,
            confirmationsNr: 1
        }));

       emit TransactionSubmitted(_txIndex, msg.sender, _to, _value);
    }

    function confirmTransaction(uint256 _txIndex) public onlyOwner {
        require(transactions[_txIndex].executed == false, 'transaction already executed');

        transactions[_txIndex].confirmationsNr += 1;
    }
}