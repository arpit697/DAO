// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;
import "./Token.sol";
import "./Treasury.sol";

contract DAO is ERC20, Treasury {
    struct Proposal {
        uint requiredAmount;
        address accountNumber;
        uint voteCount;
        bool executed;
        uint timeStamp;
    }

    uint public voteRequired;

    Proposal[] public proposals;
    mapping(uint => mapping(address => bool)) public isConfirmed;
    mapping(uint => mapping(address => uint)) public confirmedWith;

    modifier onlyTokenHolder() {
        require(balanceOf[msg.sender] != 0, "not a token holder");
        _;
    }

    modifier notExecuted(uint _propIndex) {
        require(!proposals[_propIndex].executed, "proposal already executed");
        _;
    }

    modifier propExists(uint _propIndex) {
        require(_propIndex < proposals.length, "proposal does not exists");
        _;
    }

    modifier notConfirmed(uint _propIndex) {
        require(
            !isConfirmed[_propIndex][msg.sender],
            "proposal is already confirmed"
        );
        _;
    }

    modifier notOver(uint _propIndex) {
        require(
            proposals[_propIndex].timeStamp > block.timestamp,
            "voting time is over"
        );
        _;
    }

    constructor(
        address[] memory _tokenHolders,
        uint _value,
        uint _voteRequired
    ) ERC20(_tokenHolders, _value) {
        voteRequired = _voteRequired;
    }

    function submitProposal(
        uint _requirendAmount,
        address _accountNumber,
        uint _timeStamp
    ) public {
        proposals.push(
            Proposal({
                requiredAmount: _requirendAmount,
                accountNumber: _accountNumber,
                voteCount: 0,
                executed: false,
                timeStamp: block.timestamp + _timeStamp
            })
        );
    }

    function confirmProposal(uint _propIndex)
        public
        onlyTokenHolder
        propExists(_propIndex)
        notExecuted(_propIndex)
        notConfirmed(_propIndex)
        notOver(_propIndex)
    {
        confirmedWith[_propIndex][msg.sender] = balanceOf[msg.sender];
        proposals[_propIndex].voteCount += balanceOf[msg.sender];
        isConfirmed[_propIndex][msg.sender] = true;
    }

    function executeProposal(uint _propIndex)
        public
        onlyTokenHolder
        propExists(_propIndex)
        notExecuted(_propIndex)
    {
        require(
            proposals[_propIndex].voteCount >= voteRequired,
            "votes are not sufficient.."
        );
        proposals[_propIndex].executed = true;
    }

    function revokeConfirmation(uint _propIndex)
        public
        onlyTokenHolder
        propExists(_propIndex)
        notExecuted(_propIndex)
        notOver(_propIndex)
    {
        require(
            isConfirmed[_propIndex][msg.sender],
            "proposal is not confirmed"
        );
        proposals[_propIndex].voteCount -= confirmedWith[_propIndex][
            msg.sender
        ];
        isConfirmed[_propIndex][msg.sender] = false;
    }

    function fundTransfer(uint _propIndex) public payable onlyTokenHolder {
        require(
            proposals[_propIndex].executed == true,
            "proposal is not executed"
        );
        payable(proposals[_propIndex].accountNumber).transfer(
            proposals[_propIndex].requiredAmount
        );
    }

    function getContractBalance() public view returns (uint) {
        return address(this).balance;
    }

    function getAccountBalance(address _account) public view returns (uint) {
        return address(_account).balance;
    }

    function addConfirmWith(uint _propIndex)
        public
        view
        onlyTokenHolder
        returns (uint)
    {
        return confirmedWith[_propIndex][msg.sender];
    }
}
