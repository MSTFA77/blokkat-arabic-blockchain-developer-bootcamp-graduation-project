// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract USDWithdrawer {
    AggregatorV3Interface internal priceFeed;
    address payable public owner;

    constructor() {
        // Scroll Sepolia ETH/USD Chainlink price feed
        priceFeed = AggregatorV3Interface(0x59F1ec1f10bD7eD9B938431086bC1D9e233ECf41);
        owner = payable(msg.sender);
    }

    /// @notice Get the amount of ETH (in wei) equivalent to 50 USD
    function getETHAmountFor50USD() public view returns (uint256) {
        (, int256 price,,,) = priceFeed.latestRoundData();
        require(price > 0, "Invalid price");

        // 50 USD * 1e26 / price (8 decimals)
        uint256 ethAmount = (50 * 1e26) / uint256(price);
        return ethAmount; // returns in wei
    }

    /// @notice Withdraw the amount of ETH equivalent to 50 USD if enough balance exists
    function withdraw50USDInETH() public {
        require(msg.sender == owner, "Only owner can withdraw");
        uint256 amountInETH = getETHAmountFor50USD();
        require(address(this).balance >= amountInETH, "Not enough ETH in contract");
        owner.transfer(amountInETH);
    }

    // Allow contract to receive ETH
    receive() external payable {}
}