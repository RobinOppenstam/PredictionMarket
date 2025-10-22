// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PredictionMarket.sol";

contract CreateMarketsScript is Script {
    // Sepolia Chainlink Price Feeds
    address constant SEPOLIA_XAU_USD = 0xC5981F461d74c46eB4b0CF3f4Ec79f025573B0Ea; // Gold/USD
    address constant SEPOLIA_ETH_USD = 0x694AA1769357215DE4FAC081bf1f309aDC325306; // ETH/USD

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address marketAddress = vm.envAddress("PREDICTION_MARKET_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);

        console.log("=== Creating Initial Markets ===");
        console.log("");

        PredictionMarket market = PredictionMarket(marketAddress);

        // Create Gold vs ETH race market
        market.createMarket(
            "Gold vs ETH to $5000",
            "Gold reaches $5000 first",
            "ETH reaches $5000 first",
            SEPOLIA_XAU_USD,
            SEPOLIA_ETH_USD,
            5000_00000000, // $5000 with 8 decimals
            90 // 90 days
        );
        console.log("   Race market created (Market ID: 0)");
        console.log("");
        console.log("   NOTE: Daily markets will be created by the automation service");
        console.log("");

        vm.stopBroadcast();

        console.log("=== DONE ===");
    }
}
