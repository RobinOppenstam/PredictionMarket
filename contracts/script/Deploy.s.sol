// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PredictionMarket.sol";

contract DeployScript is Script {
    // Sepolia Chainlink Price Feeds
    address constant SEPOLIA_XAU_USD = 0xC5981F461d74c46eB4b0CF3f4Ec79f025573B0Ea; // Gold/USD  
    address constant SEPOLIA_ETH_USD = 0x694AA1769357215DE4FAC081bf1f309aDC325306; // ETH/USD
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Deploy the prediction market
        PredictionMarket market = new PredictionMarket();
        console.log("PredictionMarket deployed to:", address(market));
        
        // Create initial market (Gold vs ETH to $5000)
        market.createMarket(
            "Gold vs ETH to $5000",
            "Gold reaches $5000 first",
            "ETH reaches $5000 first",
            SEPOLIA_XAU_USD,
            SEPOLIA_ETH_USD,
            5000_00000000, // $5000 with 8 decimals
            90 // 90 days
        );
        
        console.log("Initial market created");
        console.log("Market ID: 0");
        console.log("Gold Oracle:", SEPOLIA_XAU_USD);
        console.log("ETH Oracle:", SEPOLIA_ETH_USD);
        
        vm.stopBroadcast();
    }
}

contract DeployLocalScript is Script {
    function run() external {
        vm.startBroadcast();
        
        // Deploy mock oracles for local testing
        MockV3Aggregator goldOracle = new MockV3Aggregator(8, 2000_00000000);
        MockV3Aggregator ethOracle = new MockV3Aggregator(8, 1800_00000000);
        
        console.log("Gold Oracle deployed to:", address(goldOracle));
        console.log("ETH Oracle deployed to:", address(ethOracle));
        
        // Deploy the prediction market
        PredictionMarket market = new PredictionMarket();
        console.log("PredictionMarket deployed to:", address(market));
        
        // Create initial market
        market.createMarket(
            "Gold vs ETH to $5000",
            "Gold reaches $5000 first",
            "ETH reaches $5000 first",
            address(goldOracle),
            address(ethOracle),
            5000_00000000,
            30 // 30 days
        );
        
        console.log("Initial market created with mock oracles");
        
        vm.stopBroadcast();
    }
}

// Mock oracle contract for local development
contract MockV3Aggregator {
    uint8 public decimals;
    int256 public latestAnswer;
    uint256 public latestTimestamp;
    uint256 public latestRound;

    constructor(uint8 _decimals, int256 _initialAnswer) {
        decimals = _decimals;
        latestAnswer = _initialAnswer;
        latestTimestamp = block.timestamp;
        latestRound = 1;
    }

    function updateAnswer(int256 _answer) external {
        latestAnswer = _answer;
        latestTimestamp = block.timestamp;
        latestRound++;
    }

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        )
    {
        return (
            uint80(latestRound),
            latestAnswer,
            latestTimestamp,
            latestTimestamp,
            uint80(latestRound)
        );
    }
}