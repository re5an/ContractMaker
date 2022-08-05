// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/token/ERC20/IERC20.sol';
import './token.sol';
import './ContractEntity.sol';
import './helpers/Freezable.sol';


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