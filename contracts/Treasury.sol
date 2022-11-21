// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Treasury{
   uint public totalFund ;

    receive() external payable {
        totalFund = totalFund + msg.value;
    }
}