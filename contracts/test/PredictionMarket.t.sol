// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PredictionMarket.sol";
import "../script/Deploy.s.sol";

contract PredictionMarketTest is Test {
    PredictionMarket public market;
    MockV3Aggregator public goldOracle;
    MockV3Aggregator public ethOracle;

    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);

    uint8 constant DECIMALS = 8;
    int256 constant INITIAL_GOLD_PRICE = 2000_00000000; // $2000
    int256 constant INITIAL_ETH_PRICE = 1800_00000000; // $1800
    int256 constant TARGET_PRICE = 5000_00000000; // $5000

    function setUp() public {
        vm.startPrank(owner);
        
        // Deploy mock oracles
        goldOracle = new MockV3Aggregator(DECIMALS, INITIAL_GOLD_PRICE);
        ethOracle = new MockV3Aggregator(DECIMALS, INITIAL_ETH_PRICE);
        
        // Deploy market contract
        market = new PredictionMarket();
        
        // Create a test market
        market.createMarket(
            "Gold vs ETH to $5000",
            "Gold reaches $5000 first",
            "ETH reaches $5000 first",
            address(goldOracle),
            address(ethOracle),
            TARGET_PRICE,
            30 // 30 days
        );
        
        vm.stopPrank();

        // Fund test users
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
    }

    function testCreateMarket() public {
        uint256 marketCount = market.getMarketCount();
        assertEq(marketCount, 1, "Market should be created");

        PredictionMarket.Market memory mkt = market.getMarket(0);
        assertEq(mkt.name, "Gold vs ETH to $5000");
        assertEq(mkt.targetPrice, TARGET_PRICE);
        assertFalse(mkt.resolved);
    }

    function testPlaceBet() public {
        vm.startPrank(user1);
        
        market.placeBet{value: 1 ether}(0, true); // Bet on Gold
        
        (uint256 amount, bool betOnA, bool hasBet) = market.getUserBet(0, user1);
        assertTrue(hasBet);
        assertTrue(betOnA);
        assertEq(amount, 1 ether);
        
        vm.stopPrank();
    }

    function testMultipleBets() public {
        vm.prank(user1);
        market.placeBet{value: 2 ether}(0, true); // Bet on Gold
        
        vm.prank(user2);
        market.placeBet{value: 3 ether}(0, false); // Bet on ETH

        PredictionMarket.Market memory mkt = market.getMarket(0);
        assertEq(mkt.totalPoolA, 2 ether);
        assertEq(mkt.totalPoolB, 3 ether);
    }

    function testGetMarketOdds() public {
        vm.prank(user1);
        market.placeBet{value: 2 ether}(0, true);
        
        vm.prank(user2);
        market.placeBet{value: 3 ether}(0, false);

        (uint256 oddsA, uint256 oddsB, uint256 totalPool) = market.getMarketOdds(0);
        
        assertEq(totalPool, 5 ether);
        assertEq(oddsA, 4000); // 40%
        assertEq(oddsB, 6000); // 60%
    }

    function testResolveMarketGoldWins() public {
        vm.prank(user1);
        market.placeBet{value: 2 ether}(0, true);
        
        vm.prank(user2);
        market.placeBet{value: 3 ether}(0, false);

        // Fast forward time
        vm.warp(block.timestamp + 31 days);

        // Update oracle prices - Gold hits target first
        goldOracle.updateAnswer(5100_00000000); // $5100
        vm.warp(block.timestamp + 1);
        ethOracle.updateAnswer(4800_00000000); // $4800

        market.resolveMarket(0);

        PredictionMarket.Market memory mkt = market.getMarket(0);
        assertTrue(mkt.resolved);
        assertTrue(mkt.outcomeAWon);
    }

    function testClaimWinnings() public {
        vm.prank(user1);
        market.placeBet{value: 2 ether}(0, true);
        
        vm.prank(user2);
        market.placeBet{value: 3 ether}(0, false);

        // Fast forward and resolve
        vm.warp(block.timestamp + 31 days);
        goldOracle.updateAnswer(5100_00000000);
        vm.warp(block.timestamp + 1);
        ethOracle.updateAnswer(4800_00000000);
        
        market.resolveMarket(0);

        // User1 (winner) claims
        uint256 balanceBefore = user1.balance;
        vm.prank(user1);
        market.claimWinnings(0);
        uint256 balanceAfter = user1.balance;

        // User should get more than they bet
        assertGt(balanceAfter, balanceBefore);
    }

    function testCannotBetAfterEnd() public {
        vm.warp(block.timestamp + 31 days);
        
        vm.prank(user1);
        vm.expectRevert("Market has ended");
        market.placeBet{value: 1 ether}(0, true);
    }

    function testCannotResolveBeforeEnd() public {
        vm.expectRevert("Market has not ended yet");
        market.resolveMarket(0);
    }

    function testCannotClaimBeforeResolution() public {
        vm.prank(user1);
        market.placeBet{value: 1 ether}(0, true);

        vm.expectRevert("Market not resolved yet");
        vm.prank(user1);
        market.claimWinnings(0);
    }

    function testSetProtocolFee() public {
        vm.prank(owner);
        market.setProtocolFee(300); // 3%
        
        assertEq(market.protocolFee(), 300);
    }

    function testCannotSetExcessiveFee() public {
        vm.prank(owner);
        vm.expectRevert("Fee too high");
        market.setProtocolFee(1500); // 15% - too high
    }
}