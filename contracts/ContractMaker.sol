// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './token.sol';


contract Freezable {
    bool freeze = false;

    function setFreeze(bool _freeze) external {
        freeze = _freeze;
    }

    modifier frozen() {
        require(freeze, 'contract is frozen');
        _;
    }

}

contract PaymentContract is Freezable {

    address public admin; // factory is admin
    address superAdmin; // want to make it possible to set non-contract admin
    modifier isAdmin {
        require(admin == msg.sender, 'only admin');
        _;
    }

    IERC20 public token;
    function setToken(address tokenAddress) isAdmin public{
        token = IERC20(tokenAddress);
    }

    address payer;
    address receiver;
    address judge;

    uint payerFineAmount;
    uint receiverFineAmount;

    struct Parts {
        uint time;
        uint amount;
        bool paid;
    }

    uint serviceProviderShare;
    uint public contractAmount;  // total contract token amount

    uint installmentCount;
    mapping (uint => Parts) public installments;  //


    // uint public tm;
    function timeNow() public view returns (uint) {
        // tm = block.timestamp;
        return block.timestamp;
    }

    constructor () {
        admin = msg.sender;
        judge = admin;
        installmentCount = 0;
    }



    function setInstallment(uint _time, uint _amount) external {
        installments[installmentCount].amount = _amount;
        installments[installmentCount].time = _time;
        installments[installmentCount].paid = false;
        installmentCount++;
    }

    function totalAmount() external view returns (uint) {
        uint _sum = 0;
        for(uint i; i < installmentCount; i++){
            _sum += installments[i].amount;
        }
        return _sum;
    }

    //--- Total amount that Payer has to freeze
    function totalPayerAmountToFreeze() internal view returns (uint) {
        //--- extra = amount that is ours as service provider
        return contractAmount + payerFineAmount + serviceProviderShare;
    }

    function findFirstUnpaid() public view returns (uint){
        for(uint i; i < installmentCount; i++){
            if (installments[i].paid != true){
                return i;
            }
        }
        return 999666; //not found any
    }

    event AmountFrozen(address indexed _from, uint _amount, address _to, uint indexed _date);

    function receiverDepositFine(uint _amount) external {
        require(receiverFineAmount <= _amount, "wrong amount");
        userToContract(_amount, receiver);
    }

    function payerDepositContractAmount(uint _extra) external {
        require(totalPayerAmountToFreeze() > contractAmount, "wrong amount");
        userToContract(totalPayerAmountToFreeze(), payer);
    }

    function userToContract(uint _amount, address _payer) public {
        require(_amount > 0, "Amount is 0");
        // require(token.balanceOf(address(this)) > _amount, "low balance");
        uint256 _allowance = token.allowance(_payer, address(this));
        require(_allowance >= _amount, "Low Token Allowance");
        token.transferFrom(_payer, address(this), _amount);
        emit AmountFrozen(_payer, _amount, address(this), block.timestamp);
    }

    //--- Withraw serviceProviderShare to Admin address
    function takeOurShare() isAdmin external {
        transferFromContract(payable(admin), serviceProviderShare);
    }
    //--- Withraw any amount to any introduced address
    function adminWithraw(address _to, uint _amount) isAdmin external {
        transferFromContract(payable(_to), _amount);
    }

    event withraw(uint _amount, address indexed _to, uint _time);
    function transferFromContract(address payable _to, uint _amount) internal {
        require(_amount > 0, "You need to Buy More than Zero");
        uint256 dexBalance = token.balanceOf(address(this));
        require(_amount <= dexBalance, "Not enough tokens in the reserve");
        token.transfer(_to, _amount);
        emit withraw(_amount, _to, block.timestamp);
    }

    //--- If want to do multicall, we have to take its encoded data, which this func provides
    function setInstallmentABI(uint _time, uint _amount) pure public returns(bytes memory){
        return abi.encodeWithSignature("setInstallment(uint,uint)", _time, _amount);
    }

    function setContractAmount(uint _amount) public {
        contractAmount = _amount;
    }

    function setPayerFineAmount(uint _amount) public {
        payerFineAmount = _amount;
    }

    function setReceiverFineAmount(uint _amount) public {
        receiverFineAmount = _amount;
    }

    function setPayer(address _payer) external {
        payer = _payer;
    }

    function setReceiver(address _receiver) external {
        receiver = _receiver;
    }

    function setJudge(address _judge) external {
        judge = _judge;
    }
    // So that it can receive ETH from other contracts
    fallback() external payable {}
    receive() external payable {}


}

contract contractMaker is Freezable {
    // contracts
    PaymentContract[] public contracts;
    mapping (uint => PaymentContract) public paymentContract;
    uint contractsCount;
    function createContract() external {

        PaymentContract newContract = new PaymentContract();//
        contracts.push(newContract);
        // paymentContract[contractsCount] = new PaymentContract();//
        // paymentContract[contractsCount] = newContract;
        // contractsCount++;
    }

    constructor () payable{
        contractsCount = 0;
    }

    function setInstallment(uint _contractID, uint _time, uint _amount) external returns(bool) {
        //--- check and validate
        contracts[_contractID].setInstallment(_time, _amount);
        return true;
    }


}