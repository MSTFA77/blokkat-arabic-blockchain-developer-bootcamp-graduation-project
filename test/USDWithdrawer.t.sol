// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/USDWithdrawer.sol";

contract MockPriceFeed is AggregatorV3Interface {
    int256 private price;
    uint8 private decimalsVal;
    string private desc;

    constructor(int256 _price, uint8 _decimals, string memory _desc) {
        price = _price;
        decimalsVal = _decimals;
        desc = _desc;
    }

    function latestRoundData()
        external
        view
        returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)
    {
        return (0, price, 0, 0, 0);
    }

    function decimals() external view returns (uint8) {
        return decimalsVal;
    }

    function description() external view returns (string memory) {
        return desc;
    }

    function version() external pure returns (uint256) {
        return 1;
    }

    function getRoundData(uint80) external pure returns (uint80, int256, uint256, uint256, uint80) {
        revert("Not implemented");
    }
}

contract USDWithdrawerTest is Test {
    USDWithdrawer public usdWithdrawer;
    MockPriceFeed public mockPriceFeed;
    address payable owner = payable(address(0x123));
    address payable user = payable(address(0x456));

    function setUp() public {
        // Deploy mock price feed with ETH price at $2000 (8 decimals)
        mockPriceFeed = new MockPriceFeed(2000 * 1e8, 8, "ETH/USD");

        // Deploy USDWithdrawer as the owner
        vm.startPrank(owner);
        usdWithdrawer = new USDWithdrawer();

        // Replace the price feed with our mock for testing
        vm.store(address(usdWithdrawer), bytes32(uint256(0)), bytes32(uint256(uint160(address(mockPriceFeed)))));
        vm.stopPrank();
    }

    function test_OwnerIsSetCorrectly() public view {
        assertEq(usdWithdrawer.owner(), owner);
    }

    function test_GetETHAmountFor50USD() public view {
        // At $2000/ETH, 50 USD should be 0.025 ETH (25e15 wei)
        uint256 expectedAmount = 25e15;
        uint256 actualAmount = usdWithdrawer.getETHAmountFor50USD();
        assertEq(actualAmount, expectedAmount);
    }

    function test_Withdraw50USDInETH() public {
        // Fund the contract with 0.03 ETH (more than needed)
        vm.deal(address(usdWithdrawer), 0.03 ether);

        uint256 contractBalanceBefore = address(usdWithdrawer).balance;
        uint256 ownerBalanceBefore = owner.balance;

        // Expected amount is 0.025 ETH at $2000/ETH
        uint256 expectedWithdrawal = 25e15;

        vm.prank(owner);
        usdWithdrawer.withdraw50USDInETH();

        uint256 contractBalanceAfter = address(usdWithdrawer).balance;
        uint256 ownerBalanceAfter = owner.balance;

        assertEq(contractBalanceAfter, contractBalanceBefore - expectedWithdrawal);
        assertEq(ownerBalanceAfter, ownerBalanceBefore + expectedWithdrawal);
    }

    function test_WithdrawFailsWhenNotEnoughBalance() public {
        // Fund the contract with less than needed (0.01 ETH)
        vm.deal(address(usdWithdrawer), 0.01 ether);

        vm.prank(owner);
        vm.expectRevert("Not enough ETH in contract");
        usdWithdrawer.withdraw50USDInETH();
    }

    function test_OnlyOwnerCanWithdraw() public {
        // Fund the contract
        vm.deal(address(usdWithdrawer), 0.03 ether);

        vm.prank(user); // Not owner
        vm.expectRevert("Only owner can withdraw");
        usdWithdrawer.withdraw50USDInETH();
    }

    function test_ReceiveFunctionWorks() public {
        uint256 sendAmount = 1 ether;
        vm.deal(user, sendAmount);

        uint256 contractBalanceBefore = address(usdWithdrawer).balance;

        vm.prank(user);
        (bool success,) = address(usdWithdrawer).call{value: sendAmount}("");
        require(success, "Transfer failed");

        uint256 contractBalanceAfter = address(usdWithdrawer).balance;
        assertEq(contractBalanceAfter, contractBalanceBefore + sendAmount);
    }

    function test_InvalidPriceReverts() public {
        // Deploy new mock with invalid price (0)
        MockPriceFeed invalidPriceFeed = new MockPriceFeed(0, 8, "ETH/USD");

        // Replace the price feed with our invalid mock
        vm.startPrank(owner);
        vm.store(address(usdWithdrawer), bytes32(uint256(0)), bytes32(uint256(uint160(address(invalidPriceFeed)))));
        vm.stopPrank();

        vm.expectRevert("Invalid price");
        usdWithdrawer.getETHAmountFor50USD();
    }
}
