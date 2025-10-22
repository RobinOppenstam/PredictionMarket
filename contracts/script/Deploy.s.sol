// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PredictionMarket.sol";
import "../src/PredictionUSD.sol";
import "../src/PredictionETH.sol";
import "../src/TokenFaucet.sol";

contract DeployScript is Script {
    // Sepolia Chainlink Price Feeds
    address constant SEPOLIA_BTC_USD = 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43; // BTC/USD
    address constant SEPOLIA_XAU_USD = 0xC5981F461d74c46eB4b0CF3f4Ec79f025573B0Ea; // Gold/USD
    address constant SEPOLIA_ETH_USD = 0x694AA1769357215DE4FAC081bf1f309aDC325306; // ETH/USD

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        console.log("=== Deploying Prediction Market System ===");
        console.log("");

        // 1. Deploy betting token
        console.log("1. Deploying pUSD...");
        PredictionUSD pUSD = new PredictionUSD();
        console.log("   pUSD deployed to:", address(pUSD));
        console.log("");

        // 2. Deploy faucet
        console.log("2. Deploying Token Faucet...");
        TokenFaucet faucet = new TokenFaucet(address(pUSD));
        console.log("   Faucet deployed to:", address(faucet));
        console.log("");

        // 3. Set faucet address in token
        console.log("3. Configuring token permissions...");
        pUSD.setFaucet(address(faucet));
        console.log("   Faucet permissions granted");
        console.log("");

        // 4. Deploy prediction market
        console.log("4. Deploying PredictionMarket...");
        PredictionMarket market = new PredictionMarket(address(pUSD));
        console.log("   PredictionMarket deployed to:", address(market));
        console.log("");

        // 5. Create initial markets
        console.log("5. Creating initial markets...");

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

        // Create first daily Bitcoin over/under market
        uint256 nextMidnight = ((block.timestamp / 1 days) + 1) * 1 days;
        market.createDailyOverUnder(SEPOLIA_BTC_USD, nextMidnight);
        console.log("   Daily Bitcoin over/under market created (Market ID: 1)");
        console.log("");

        vm.stopBroadcast();

        // Print summary
        console.log("=== DEPLOYMENT SUMMARY ===");
        console.log("");
        console.log("Token:");
        console.log("  pUSD:", address(pUSD));
        console.log("");
        console.log("Faucet:");
        console.log("  Address:", address(faucet));
        console.log("  Claim Amount: 5000 pUSD + 1 pETH every 24 hours");
        console.log("");
        console.log("Prediction Market:");
        console.log("  Address:", address(market));
        console.log("");
        console.log("Oracles:");
        console.log("  BTC/USD:", SEPOLIA_BTC_USD);
        console.log("  ETH/USD:", SEPOLIA_ETH_USD);
        console.log("  Gold/USD:", SEPOLIA_XAU_USD);
        console.log("");
        console.log("=== NEXT STEPS ===");
        console.log("");
        console.log("1. Set automation service address:");
        console.log("   cast send", address(market), '"setAutomationService(address)" YOUR_AUTOMATION_WALLET');
        console.log("");
        console.log("2. Update .env files with deployed addresses");
        console.log("");
    }
}

contract DeployLocalScript is Script {
    function run() external {
        vm.startBroadcast();

        console.log("=== Deploying LOCAL Prediction Market System ===");
        console.log("");

        // Deploy mock oracles
        console.log("1. Deploying mock oracles...");
        MockV3Aggregator btcOracle = new MockV3Aggregator(8, 95000_00000000); // $95,000
        MockV3Aggregator ethOracle = new MockV3Aggregator(8, 3500_00000000);  // $3,500
        MockV3Aggregator goldOracle = new MockV3Aggregator(8, 2000_00000000); // $2,000
        console.log("   BTC Oracle:", address(btcOracle));
        console.log("   ETH Oracle:", address(ethOracle));
        console.log("   Gold Oracle:", address(goldOracle));
        console.log("");

        // Deploy betting token
        console.log("2. Deploying pUSD...");
        PredictionUSD pUSD = new PredictionUSD();
        console.log("   pUSD deployed to:", address(pUSD));
        console.log("");

        // Deploy faucet
        console.log("3. Deploying Token Faucet...");
        TokenFaucet faucet = new TokenFaucet(address(pUSD));
        console.log("   Faucet deployed to:", address(faucet));
        console.log("");

        // Configure permissions
        console.log("4. Configuring permissions...");
        pUSD.setFaucet(address(faucet));
        console.log("   Faucet permissions granted");
        console.log("");

        // Deploy prediction market
        console.log("5. Deploying PredictionMarket...");
        PredictionMarket market = new PredictionMarket(address(pUSD));
        console.log("   PredictionMarket deployed to:", address(market));
        console.log("");

        // Create initial markets
        console.log("6. Creating initial markets...");
        market.createMarket(
            "Gold vs ETH to $5000",
            "Gold reaches $5000 first",
            "ETH reaches $5000 first",
            address(goldOracle),
            address(ethOracle),
            5000_00000000,
            30 // 30 days
        );
        console.log("   Race market created (Market ID: 0)");

        // Create first daily market (5 minutes for testing)
        uint256 endTime = block.timestamp + 5 minutes;
        market.createDailyOverUnder(address(btcOracle), endTime);
        console.log("   Daily Bitcoin market created (Market ID: 1, 5 min duration)");
        console.log("");

        vm.stopBroadcast();

        // Print summary
        console.log("=== DEPLOYMENT SUMMARY ===");
        console.log("");
        console.log("Token:");
        console.log("  pUSD:", address(pUSD));
        console.log("");
        console.log("Faucet:");
        console.log("  Address:", address(faucet));
        console.log("");
        console.log("Prediction Market:");
        console.log("  Address:", address(market));
        console.log("");
        console.log("Mock Oracles:");
        console.log("  BTC/USD:", address(btcOracle));
        console.log("  ETH/USD:", address(ethOracle));
        console.log("  Gold/USD:", address(goldOracle));
        console.log("");
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