// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

pragma experimental ABIEncoderV2;
import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';
import './token.sol';

import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";


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

    modifier hasWriteAccess {
        require(msg.sender == admin || msg.sender == payer || msg.sender == receiver, "no access");
        _;
    }

    uint payerFineAmount;
    uint receiverFineAmount;

    //--- TODO: change its name to TimebasedParts
    struct Parts {
        uint time;
        uint amount;
        bool paid;
    }

    // struct Parts2 {
    //     uint time; // if time=0 then its event based
    //     uint amount;
    //     bool paid;
    //     address approver; // if time=0 then approver address has to confirm the payment
    // }

    uint public serviceProviderShare;
    uint public contractAmount;  // total contract token amount

    uint public totalPaymentsCount; //--- Total
    uint public installmentCount;  //--- installments that has set counts

    //todo: use Parts[] public timebasedParts
    mapping (uint => Parts) public installments;  //--- detail of each payment. (supposed to be like: uinxTime=>Parts but I forgot it and made it like Iterable Array which is not good.) Change it later and use Parts[] array
    // Parts[] public timebasedParts;  //--- detail of each payment. Instead of installments variables




    // constructor (address _payer, address _receiver, uint _count, uint _totalAmount, address _token , uint _id) {
    //     admin = msg.sender;
    //     judge = admin;
    //     installmentCount = 0;
    //     payer = _payer;
    //     receiver = _receiver;
    //     totalPaymentsCount = _count;
    //     contractID = _id;
    //     token = IERC20(_token);
    //     contractAmount = _totalAmount;
    // }

    constructor (address _payer, address _receiver, uint _count, uint _totalAmount, address _token , uint _id, uint[] memory _partAmounts, uint[] memory _partTimes) {
        admin = msg.sender;
        judge = admin;
        installmentCount = 0;
        payer = _payer;
        receiver = _receiver;
        totalPaymentsCount = _count;
        contractID = _id;
        token = IERC20(_token);
        contractAmount = _totalAmount;

        require(_partTimes.length == _partAmounts.length, "inconsistent") ;
        for(uint i = 0; i < _partAmounts.length; i++){
            setInstallment(_partTimes[i], _partAmounts[i]);
        }
    }



    function setInstallment(uint _time, uint _amount) public {
        // require (totalPaymentsCount > 0 , "paymentCounts not specified");
        // require (installmentCount < totalPaymentsCount, "all installments are set");

        // installments[installmentCount].time = _time;
        // installments[installmentCount].amount = _amount;
        // installments[installmentCount].paid = false;
        installments[installmentCount] = Parts(_time, _amount, false);
        installmentCount++;
    }

    /* Done */
    function totalinstallmentAmount() external view returns (uint) {
        uint _sum = 0;
        for(uint i; i < installmentCount; i++){
            _sum += installments[i].amount;
        }
        return _sum;
    }

    /* Done */
    function dayCalc(uint _days) public pure returns (uint) {
        return _days * 3600 * 24;
    }

    function installmentPartPay(uint _num) public {

        require(!installments[_num].paid, "already paid");
        //--- check time
        require(
            (block.timestamp < (installments[_num].time + dayCalc(1))
        &&
        (block.timestamp >= installments[_num].time)
            ) , "its not time");



        //--- TODO : transfer tokens
        token.transfer(receiver, installments[installmentCount].amount);
        installments[_num].paid = true;
    }

    /* Done */
    function setTotalPaymentsCount(uint _num) external {
        totalPaymentsCount = _num;
    }

    //--- Total amount that Payer has to freeze
    function totalPayerAmountToFreeze() internal view returns (uint) {
        //--- extra = amount that is ours as service provider
        return contractAmount + payerFineAmount + serviceProviderShare;
    }

    /* Done */
    function findFirstUnpaid() public view returns (uint){
        for(uint i; i < installmentCount; i++){
            if (installments[i].paid != true){
                return i;
            }
        }
        return 999666; //not found any
    }

    event AmountFrozen(address indexed _from, uint _amount, address _to, uint indexed _date);

    // function receiverDepositFine(uint _amount) external {
    //     require(receiverFineAmount <= _amount, "wrong amount");
    //     userToContract(_amount, receiver);
    // }

    // function payerDepositContractAmount() external {
    //     require(totalPayerAmountToFreeze() > contractAmount, "wrong amount");
    //     userToContract(totalPayerAmountToFreeze(), payer);
    // }

    // function userToContract(uint _amount, address _payer) public {
    //     require(_amount > 0, "Amount is 0");
    //     // require(token.balanceOf(address(this)) > _amount, "low balance");
    //     uint256 _allowance = token.allowance(_payer, address(this));
    //     require(_allowance >= _amount, "Low Token Allowance");
    //     token.transferFrom(_payer, address(this), _amount);
    //     emit AmountFrozen(_payer, _amount, address(this), block.timestamp);
    // }

    //--- Withraw serviceProviderShare to Admin address
    // function takeOurShare() isAdmin external {
    //     transferFromContract(payable(admin), serviceProviderShare);
    // }
    //--- Withraw any amount to any introduced address
    // function adminWithraw(address _to, uint _amount) isAdmin external {
    //     transferFromContract(payable(_to), _amount);
    // }

    event withraw(uint _amount, address indexed _to, uint _time);
    function transferFromContract(address payable _to, uint _amount) internal {
        require(_amount > 0, "You need to Buy More than Zero");
        uint256 dexBalance = token.balanceOf(address(this));
        require(_amount <= dexBalance, "Not enough tokens in the reserve");
        token.transfer(_to, _amount);
        emit withraw(_amount, _to, block.timestamp);
    }

    //--- If want to do multicall, we have to take its encoded data, which this func provides
    // function setInstallmentABI(uint _time, uint _amount) pure public returns(bytes memory){
    //     return abi.encodeWithSignature("setInstallment(uint,uint)", _time, _amount);
    // }

    // function setContractAmount(uint _amount) hasWriteAccess public {
    //     contractAmount = _amount;
    // }

    // function setPayerFineAmount(uint _amount) public {
    //     payerFineAmount = _amount;
    // }

    // function setReceiverFineAmount(uint _amount) public {
    //     receiverFineAmount = _amount;
    // }

    // function setPayer(address _payer) external {
    //     payer = _payer;
    // }

    // function setReceiver(address _receiver) external {
    //     receiver = _receiver;
    // }

    // function setJudge(address _judge) external {
    //     judge = _judge;
    // }

    // address immutable contractMaker;
    function todaysTx() isAdmin view public returns(bool, uint, uint, address, address){
        uint _partNo = findFirstUnpaid();
        Parts memory _part = installments[_partNo];
        // if(block.timestamp >= _part.time && block.timestamp < _part.time + dayCalc(1) ){
        if(isInTimeRange(_part.time)){
            //--- Consider: Approve the amount to main contract so it can transferFrom. But it cant be VIEW and will cost
            // setApprove(_part.amount);
            return (true, contractID, _part.amount, receiver, address(token)); /*send contractID or this.address (1)*/
        }
        return(false, contractID,0,receiver, address(token));
    }

    function setApprove(uint _amount) internal returns(bool){
        //--- TODO: validations
        token.approve(admin, _amount);
        return true;
    }

    function isInTimeRange(uint _time) view internal returns(bool){
        if(block.timestamp >= _time && block.timestamp < _time + dayCalc(1) ){
            return true;
        }
        return false;
    }

    uint immutable contractID;
    // function test_finishContract() public {
    //     //--- run contractMaker (admin) to take out this contract from activeContracts
    //     //--- Take all its remaining tokens and Ethers/BNB
    //     //--- EVENT
    //     contractMaker(admin).inActivateContract(contractID); /* Check if makes a new one or uses the already deployed */
    // }

    // So that it can receive ETH from other contracts
    fallback() external payable {}
    receive() external payable {}


}

contract contractMaker is Ownable, Freezable {

    PaymentContract[] public contracts;
    // mapping (uint => PaymentContract) public paymentContract;
    // mapping (address => mapping(address => bool)) public isFriend; /* nested mapping example */
    mapping (uint => bool) public activeContracts; // to only check contracts that still are active. When contract finish, it gets false
    uint contractsCount;

    //--- Create contract without installments
    // function createContract(address _payer, address _receiver, uint _paymentsCount, uint _totalAmount, address _token) external {
    //     PaymentContract newContract = new PaymentContract(_payer, _receiver, _paymentsCount, _totalAmount, _token, contractsCount);//
    //     contracts.push(newContract);
    //     // paymentContract[contractsCount] = newContract;
    //     activeContracts[contractsCount] = true;
    //     contractsCount++;
    // }

    //--- Create Contract and put all installments together in one transaction
    function createContract(address _payer, address _receiver, uint _paymentsCount, uint _totalAmount, address _token, uint[] calldata _partAmounts, uint[] calldata _partTimes) external {
        //--- Validations
        validatePaymentAmount(_paymentsCount, _totalAmount, _partAmounts, _partTimes);
        validatePaymentTimes(_partTimes);

        PaymentContract newContract = new PaymentContract(_payer, _receiver, _paymentsCount, _totalAmount, _token, contractsCount, _partAmounts, _partTimes);//
        contracts.push(newContract);
        // paymentContract[contractsCount] = newContract;
        activeContracts[contractsCount] = true;
        contractsCount++;
    }

    function validatePaymentAmount(uint _paymentsCount, uint _totalAmount, uint[] calldata _partAmounts, uint[] calldata _partTimes) pure internal{
        require(_partAmounts.length == _partTimes.length && _partTimes.length == _paymentsCount, "payments numbers dont match");

        uint _sum = 0;
        for(uint i = 0; i < _partAmounts.length; i++){
            _sum += _partAmounts[i];
        }
        require(_sum == _totalAmount, "total amount not equal with paymentParts");
    }

    function validatePaymentTimes(uint[] calldata _partTimes) view internal {
        for (uint i=0; i < _partTimes.length; i++){
            require(_partTimes[i] > block.timestamp, "time less than now");
        }
    }



    constructor () payable{
        contractsCount = 0;
        //--- TODO: set owner
    }



    //--- TODO: it has error. it sends a fixed size array, but i wanr dynamic array
    function getActiveContracts() public view returns(uint[] memory){
        // uint[] memory _actives = new uint[](contractsCount);
        uint[] memory _actives;
        uint _cnt = 0;
        for(uint i = 0; i <= contractsCount; i++){
            if (activeContracts[i]){
                // _actives.push(i);
                _actives[_cnt] = i;
                _cnt++;
            }
        }
        return _actives;
    }

    // struct Parts {
    //     uint time;
    //     uint amount;
    //     bool paid;
    // }

    // uint[] todayContracts; //--- wanted to have the list of contracts that today have tx
    function getTodayPaymentContracts(uint[] memory _activeContracts) view public returns(uint[] memory){
        uint[] memory _todayContracts;
        uint _contractCount = 0;
        for(uint i=0; i < _activeContracts.length; i++){

            //--- todaysTx() => (true, contractID, _part.amount, receiver, address(token))
            // (bool _have, uint _contractID, uint _amount , address _receiver, address _token) = contracts[i].todaysTx();
            (bool _have, uint _contractID, , , ) = contracts[i].todaysTx();
            if(_have){
                _todayContracts[_contractCount] = _contractID;
                _contractCount++;
            }

            // for(uint j=0; j < contracts[i].installmentCount(); j++){

            // (uint _time, uint _amount , bool _paid) = Parts(contracts[i].installments[j]);
            // uint _time = contracts[i].installments[j].time;

            // (uint _time, uint _amount , bool _paid) = contracts[i].installments[j];
            // Parts memory _part = contracts[i].installments[j];
            // Parts memory _part = Parts(contracts[i].installments[j]);

            // if(contracts[i].installments[j].paid == false
            //     && contracts[i].installments[j].time >= block.timestamp
            //     && contracts[i].installments[j].time <= block.timestamp + dayCalc(1)
            // ){

            // }

            //--- Todo: Test: call each active contract and enquire them if they have any transactions today

            // }

        }
        return _todayContracts;
    }

    function dayCalc(uint _days) public pure returns (uint) {
        return _days * 3600 * 24;
    }

    function setInstallment(uint _contractID, uint _time, uint _amount) external {
        //--- check and validate
        // paymentContract[_contractID].setInstallment(_time, _amount); // works
        contracts[_contractID].setInstallment(_time, _amount);
        // PaymentContract(contracts[_contractID]).setInstallment(_time, _amount);
    }

    //--- its payable so that later if wanted to transfer Eth/BNB from child contracts, we can do it easily
    function inActivateContract(uint _id) public payable {
        //--- TODO: Validations
        require(activeContracts[_id] == true, "not active");
        activeContracts[_id] = false;
    }

    function timeNow() public view returns (uint) {
        return block.timestamp;
    }

    /* checkUpkeep Function is for CHainlink Keepers to see if its time to execute function performUpkeep */
    function checkUpkeep(bytes calldata /* checkData */) external view returns (bool upkeepNeeded, bytes memory /* performData */) {
        //--- using  getActiveContracts() get all active contracts to check if its time for them to pay
        uint[] memory _todayContracts = getTodayPaymentContracts(getActiveContracts());
        if(_todayContracts.length > 0){
            upkeepNeeded = true;
        }
        //     upkeepNeeded = (block.timestamp - lastTimeStamp) > interval;
        //     // We don't use the checkData in this example. The checkData is defined when the Upkeep was registered.
    }

    function performUpkeep(bytes calldata /* performData */) external {
        //We highly recommend revalidating the upkeep in the performUpkeep function

        // We don't use the performData in this example. The performData is generated by the Keeper's call to your checkUpkeep function
    }


}


/*
Things to Consider:

- One payment per day from each Contract

- when putting installments, have to sort them based on time before saving them
    (because system is designed to find the first unpaid part and act based on that)

- later I have to add some event based installment agreement to dapp.
    (seperate it so waste less gas for iterating on installments)
    (have to make a whitelist of accounts that are allowed to call event)

*/


/*
Explainers:
Based on numbers in comments at codes:

(1) i used contractID instead of contract's address (this.address), so that in main contract I can check if its really one of our contracts
    otherwise maybe a hacker sends other address for his malicious goals

(2)

()

()

*/