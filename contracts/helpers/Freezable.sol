// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

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