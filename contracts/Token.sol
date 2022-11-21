// // SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "../interfaces/IERC20.sol";

contract ERC20 is IERC20{
    uint public override totalSupply = 1000;
    mapping(address => uint) public override balanceOf;
    mapping(address => mapping(address => uint)) public override allowance;
    constructor(address[] memory _tokenHolders , uint256 _value){
        uint total =  _value * _tokenHolders.length;
        require(total/_value == _tokenHolders.length , "Over Flow Condition.");
        require(totalSupply >= total , "Under Flow Condition.");
        
        for (uint i = 0; i < _tokenHolders.length; i++) {
         balanceOf[_tokenHolders[i]] += _value;
         totalSupply -= _value;
         require(balanceOf[_tokenHolders[i]] >= _value , "Over Flow Condition.");
         emit Transfer(address(this), _tokenHolders[i], _value);
     }
    }

    string name = "Appinventiv";
    string symbol = "APP";
    uint8 decimals = 18;

    function transfer(address recipient, uint amount)
        external
        override
        returns (bool)
    {
        require(balanceOf[msg.sender] >= amount, "Not enough tokens");
        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    // function approve(address spender, uint amount)
    //     external
    //     override
    //     returns (bool)
    // {
    //     allowance[msg.sender][spender] = amount;
    //     emit Approval(msg.sender, spender, amount);
    //     return true;
    // }

    // function transferFrom(
    //     address sender,
    //     address recipient,
    //     uint amount
    // ) external override returns (bool) {
    //     allowance[sender][msg.sender] -= amount;
    //     balanceOf[sender] -= amount;
    //     balanceOf[recipient] += amount;
    //     emit Transfer(sender, recipient, amount);
    //     return true;
    // }

    // function mint(uint amount) external {
    //     balanceOf[msg.sender] += amount;
    //     totalSupply += amount;
    //     emit Transfer(address(0), msg.sender, amount);
    // }

    // function burn(uint amount) external {
    //     balanceOf[msg.sender] -= amount;
    //     totalSupply -= amount;
    //     emit Transfer(msg.sender, address(0), amount);
    // }
}
