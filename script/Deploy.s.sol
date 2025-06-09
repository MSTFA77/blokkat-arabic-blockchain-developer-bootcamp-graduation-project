// script/Deploy.s.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/USDWithdrawer.sol";

contract DeployUSDWithdrawer is Script {
    function run() external {
        vm.startBroadcast();
        new USDWithdrawer();
        vm.stopBroadcast();
    }
}
