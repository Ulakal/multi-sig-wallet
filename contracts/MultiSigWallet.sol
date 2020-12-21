pragma solidity 0.5.8;

contract MultiSigWallet {
    address[] public owners;
    uint public confirmationsRequired;

    struct Transaction {
        address payable to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmationsNr;
    }

    Transaction[] public transactions;

    mapping(address => bool) public isOwner;
    mapping(uint256 => mapping(address => bool)) public isConfirmed;
    mapping(address => uint256) public funds;

    modifier onlyOwner() {
        require(isOwner[msg.sender] == true, 'you are not an owner');
        _;
    }
    modifier txExists(uint _txIndex) {
        require(_txIndex < transactions.length, 'transaction doesnt exist');
        _;
    }
    modifier notExecuted(uint _txIndex) {
        require(transactions[_txIndex].executed == false, 'transaction already executed');
        _;
    }

    event TransactionSubmitted(uint256 txIndex, address indexed creator, address to, uint256 value);
    event TransactionConfirmed(uint256 txIndex, address confirmedBy);
    event TransactionExecuted(address indexed to, uint256 value, address executedBy);
    event ConfirmationRevoked(uint256 txIndex, address revokedBy);
    event Deposit(address indexed from, uint256 value, uint256 balance);

    
    
    constructor(address[] memory _owners, uint _confirmationsRequired) public {
        require(_owners.length > 0, 'owners required');
        require(_confirmationsRequired > 0 && _confirmationsRequired < _owners.length, 'invalid confirmations number');

        for (uint i=0; i < _owners.length; i++) {
            require(_owners[i] != address(0), 'invalid owner');
            require(isOwner[_owners[i]] == false, 'owner already exists' );
            
            address owner = _owners[i];
            isOwner[owner] = true;
            owners.push(owner);
        }

        confirmationsRequired = _confirmationsRequired;
    }

    function submitTransaction(address payable _to, uint256 _value, bytes memory _data) public onlyOwner {
        
        uint256 _txIndex = transactions.length;

        Transaction memory transaction;

        transaction.to = _to;
        transaction.value = _value;
        transaction.data = _data;
        transaction.executed = false;

        transactions.push(transaction);
        
        confirmTransaction(_txIndex);

       emit TransactionSubmitted(_txIndex, msg.sender, _to, _value);
    }

    function confirmTransaction(uint256 _txIndex) public onlyOwner() txExists(_txIndex) notExecuted(_txIndex) {
        require(isConfirmed[_txIndex][msg.sender] == false, 'transaction already confirmed');

        isConfirmed[_txIndex][msg.sender] = true;
        transactions[_txIndex].confirmationsNr += 1;

        emit TransactionConfirmed(_txIndex, msg.sender);
    }

    function executeTransaction(uint256 _txIndex) public onlyOwner() txExists(_txIndex) notExecuted(_txIndex) {
        require(transactions[_txIndex].confirmationsNr >= confirmationsRequired, 'not enough confirmations');

        address payable receiver = transactions[_txIndex].to;
        uint256 value = transactions[_txIndex].value;

        transactions[_txIndex].executed = true;
        receiver.transfer(value);

        emit TransactionExecuted(receiver, value, msg.sender);
    }

    function revokeConfirmation(uint256 _txIndex) public onlyOwner() txExists(_txIndex) notExecuted(_txIndex) {
        require(isConfirmed[_txIndex][msg.sender] == true, 'you havent confirmed this transaction');

        isConfirmed[_txIndex][msg.sender] = false;
        transactions[_txIndex].confirmationsNr -= 1;

        emit ConfirmationRevoked(_txIndex, msg.sender);
    }
    
    function transactionCount() public view onlyOwner() returns(uint256) {
        return transactions.length;
    }

    //this function is available for version 0.7.5 (returning an array of structs)
    /*function getTransactions() public onlyOwner() returns(Transaction[] memory){
        return transactions;
    }*/
    
    function deposit() payable external returns(uint256) {
        require(msg.value > 0, 'you must send more than 0');
        funds[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value, address(this).balance);
        return address(this).balance;
    }
    
    function balance() public view onlyOwner() returns(uint256) {
        return address(this).balance;
    }
}
