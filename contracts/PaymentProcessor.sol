// SPDX-License-Identifier: GPL-3.0
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

  address public admin;
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

  struct Parts {
    uint time;
    uint amount;
    bool paid;
  }


  //public uint totalAmount;

  uint installmentCount;

  mapping (uint => Parts) public installments;  //


  // uint public tm;
  function time() public view returns (uint) {
    // tm = block.timestamp;
    return block.timestamp;
  }

  constructor () {
    admin = msg.sender;
    judge = admin;
    installmentCount = 0;
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

  function findFirstUnpaid() public view returns (uint){
    for(uint i; i < installmentCount; i++){
      if (installments[i].paid != true){
        return i;
      }
    }
    return 666;
  }

  event AmountFrozen(address indexed _from, uint _amount, address _to, uint indexed _date);

  function userToContract(uint _amount) public {
    require(_amount > 0, "The amount is 0");
    require(token.balanceOf(address(this)) > _amount, "");
    uint256 _allowance = token.allowance(msg.sender, address(this));
    require(_allowance >= _amount, "Check the token Allowance");
    token.transferFrom(msg.sender, address(this), _amount);
    emit AmountFrozen(msg.sender, _amount, address(this), block.timestamp);
  }

  // So that it can receive ETH from other contracts
  fallback() external payable {}
  receive() external payable {}


}
