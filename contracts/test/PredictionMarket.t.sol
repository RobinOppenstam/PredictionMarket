// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PredictionMarket.sol";
import "../script/Deploy.s.sol";

contract PredictionMarketTest is Test {
    PredictionMarket public market;
    MockV3Aggregator public goldOracle;
    MockV3Aggregator public ethOracle;
    MockV3Aggregator public btcOracle;

    address public owner = address(1);
    address public user1 = address(2);
    address public user2 = address(3);
    address public automationService = address(4);

    uint8 constant DECIMALS = 8;
    int256 constant INITIAL_GOLD_PRICE = 2000_00000000; // $2000
    int256 constant INITIAL_ETH_PRICE = 1800_00000000; // $1800
    int256 constant INITIAL_BTC_PRICE = 95000_00000000; // $95,000
    int256 constant TARGET_PRICE = 5000_00000000; // $5000

    function setUp() public {
        vm.startPrank(owner);

        // Deploy mock oracles
        goldOracle = new MockV3Aggregator(DECIMALS, INITIAL_GOLD_PRICE);
        ethOracle = new MockV3Aggregator(DECIMALS, INITIAL_ETH_PRICE);
        btcOracle = new MockV3Aggregator(DECIMALS, INITIAL_BTC_PRICE);

        // Deploy market contract
        market = new PredictionMarket();

        // Set automation service address
        market.setAutomationService(automationService);

        // Create a test RACE market
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
        vm.deal(automationService, 100 ether);
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
        vm.expectRevert("Market cannot be resolved yet");
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

    // ============================================
    // DAILY OVER/UNDER MARKET TESTS
    // ============================================

    function testCreateDailyOverUnder() public {
        uint256 endTime = block.timestamp + 1 days;

        vm.prank(owner);
        market.createDailyOverUnder(address(btcOracle), endTime);

        uint256 marketCount = market.getMarketCount();
        assertEq(marketCount, 2, "Daily market should be created");

        PredictionMarket.Market memory mkt = market.getMarket(1);
        assertEq(mkt.name, "Daily Bitcoin Over/Under");
        assertEq(mkt.outcomeA, "Over");
        assertEq(mkt.outcomeB, "Under");
        assertEq(uint8(mkt.marketType), uint8(PredictionMarket.MarketType.DAILY_OVER_UNDER));
        assertEq(mkt.creationPrice, INITIAL_BTC_PRICE);
        assertEq(mkt.targetPrice, INITIAL_BTC_PRICE);
        assertEq(mkt.endTime, endTime);
        assertFalse(mkt.resolved);
        assertFalse(mkt.isAutomatic);
    }

    function testAutomationServiceCanCreateDailyMarket() public {
        uint256 endTime = block.timestamp + 1 days;

        vm.prank(automationService);
        market.createDailyOverUnder(address(btcOracle), endTime);

        PredictionMarket.Market memory mkt = market.getMarket(1);
        assertTrue(mkt.isAutomatic, "Market should be marked as automatic");
    }

    function testUnauthorizedCannotCreateDailyMarket() public {
        uint256 endTime = block.timestamp + 1 days;

        vm.prank(user1);
        vm.expectRevert("Only owner or automation service");
        market.createDailyOverUnder(address(btcOracle), endTime);
    }

    function testSetAutomationService() public {
        address newAutomation = address(5);

        vm.prank(owner);
        market.setAutomationService(newAutomation);

        // Test new automation can create markets
        vm.prank(newAutomation);
        market.createDailyOverUnder(address(btcOracle), block.timestamp + 1 days);

        assertEq(market.getMarketCount(), 2);
    }

    function testDailyMarketBetting() public {
        uint256 endTime = block.timestamp + 1 days;

        vm.prank(owner);
        market.createDailyOverUnder(address(btcOracle), endTime);

        // User1 bets Over
        vm.prank(user1);
        market.placeBet{value: 2 ether}(1, true);

        // User2 bets Under
        vm.prank(user2);
        market.placeBet{value: 3 ether}(1, false);

        PredictionMarket.Market memory mkt = market.getMarket(1);
        assertEq(mkt.totalPoolA, 2 ether);
        assertEq(mkt.totalPoolB, 3 ether);

        (uint256 amount1, bool betOnA1, bool hasBet1) = market.getUserBet(1, user1);
        assertTrue(hasBet1);
        assertTrue(betOnA1);
        assertEq(amount1, 2 ether);

        (uint256 amount2, bool betOnA2, bool hasBet2) = market.getUserBet(1, user2);
        assertTrue(hasBet2);
        assertFalse(betOnA2);
        assertEq(amount2, 3 ether);
    }

    function testDailyMarketResolutionOverWins() public {
        uint256 endTime = block.timestamp + 1 days;

        vm.prank(owner);
        market.createDailyOverUnder(address(btcOracle), endTime);

        // Place bets
        vm.prank(user1);
        market.placeBet{value: 2 ether}(1, true); // Over

        vm.prank(user2);
        market.placeBet{value: 3 ether}(1, false); // Under

        // Fast forward to end time
        vm.warp(endTime);

        // Update BTC price to higher value
        btcOracle.updateAnswer(96000_00000000); // $96,000 (up from $95,000)

        // Resolve market
        market.resolveMarket(1);

        PredictionMarket.Market memory mkt = market.getMarket(1);
        assertTrue(mkt.resolved);
        assertTrue(mkt.outcomeAWon, "Over should win when price increases");
    }

    function testDailyMarketResolutionUnderWins() public {
        uint256 endTime = block.timestamp + 1 days;

        vm.prank(owner);
        market.createDailyOverUnder(address(btcOracle), endTime);

        // Place bets
        vm.prank(user1);
        market.placeBet{value: 2 ether}(1, true); // Over

        vm.prank(user2);
        market.placeBet{value: 3 ether}(1, false); // Under

        // Fast forward to end time
        vm.warp(endTime);

        // Update BTC price to lower value
        btcOracle.updateAnswer(94000_00000000); // $94,000 (down from $95,000)

        // Resolve market
        market.resolveMarket(1);

        PredictionMarket.Market memory mkt = market.getMarket(1);
        assertTrue(mkt.resolved);
        assertFalse(mkt.outcomeAWon, "Under should win when price decreases");
    }

    function testDailyMarketResolutionUnderWinsOnEqual() public {
        uint256 endTime = block.timestamp + 1 days;

        vm.prank(owner);
        market.createDailyOverUnder(address(btcOracle), endTime);

        // Place bets
        vm.prank(user1);
        market.placeBet{value: 2 ether}(1, true); // Over

        vm.prank(user2);
        market.placeBet{value: 3 ether}(1, false); // Under

        // Fast forward to end time
        vm.warp(endTime);

        // Price stays the same
        btcOracle.updateAnswer(INITIAL_BTC_PRICE); // Same price

        // Resolve market
        market.resolveMarket(1);

        PredictionMarket.Market memory mkt = market.getMarket(1);
        assertTrue(mkt.resolved);
        assertFalse(mkt.outcomeAWon, "Under should win when price equals creation price");
    }

    function testCannotResolveDailyMarketBeforeEndTime() public {
        uint256 endTime = block.timestamp + 1 days;

        vm.prank(owner);
        market.createDailyOverUnder(address(btcOracle), endTime);

        // Try to resolve before end time
        vm.expectRevert("Daily market can only resolve at end time");
        market.resolveMarket(1);
    }

    function testDailyMarketClaimWinningsOverWon() public {
        uint256 endTime = block.timestamp + 1 days;

        vm.prank(owner);
        market.createDailyOverUnder(address(btcOracle), endTime);

        // User1 bets Over (2 ETH)
        vm.prank(user1);
        market.placeBet{value: 2 ether}(1, true);

        // User2 bets Under (3 ETH)
        vm.prank(user2);
        market.placeBet{value: 3 ether}(1, false);

        // Fast forward and resolve with Over winning
        vm.warp(endTime);
        btcOracle.updateAnswer(96000_00000000); // Price increased
        market.resolveMarket(1);

        // User1 claims winnings
        uint256 balanceBefore = user1.balance;
        vm.prank(user1);
        market.claimWinnings(1);
        uint256 balanceAfter = user1.balance;

        // User1 should get: 2 ETH (original) + share of 3 ETH (losing pool) - 2% fee
        // Share = (2 / 2) * 3 * 0.98 = 2.94 ETH
        // Total = 2 + 2.94 = 4.94 ETH
        assertGt(balanceAfter, balanceBefore);
        assertApproxEqAbs(balanceAfter - balanceBefore, 4.94 ether, 0.01 ether);
    }

    function testDailyMarketClaimWinningsUnderWon() public {
        uint256 endTime = block.timestamp + 1 days;

        vm.prank(owner);
        market.createDailyOverUnder(address(btcOracle), endTime);

        // User1 bets Over (2 ETH)
        vm.prank(user1);
        market.placeBet{value: 2 ether}(1, true);

        // User2 bets Under (3 ETH)
        vm.prank(user2);
        market.placeBet{value: 3 ether}(1, false);

        // Fast forward and resolve with Under winning
        vm.warp(endTime);
        btcOracle.updateAnswer(94000_00000000); // Price decreased
        market.resolveMarket(1);

        // User2 claims winnings
        uint256 balanceBefore = user2.balance;
        vm.prank(user2);
        market.claimWinnings(1);
        uint256 balanceAfter = user2.balance;

        // User2 should get: 3 ETH (original) + share of 2 ETH (losing pool) - 2% fee
        // Share = (3 / 3) * 2 * 0.98 = 1.96 ETH
        // Total = 3 + 1.96 = 4.96 ETH
        assertGt(balanceAfter, balanceBefore);
        assertApproxEqAbs(balanceAfter - balanceBefore, 4.96 ether, 0.01 ether);
    }

    function testLoserCannotClaimWinnings() public {
        uint256 endTime = block.timestamp + 1 days;

        vm.prank(owner);
        market.createDailyOverUnder(address(btcOracle), endTime);

        vm.prank(user1);
        market.placeBet{value: 2 ether}(1, true); // Over

        vm.prank(user2);
        market.placeBet{value: 3 ether}(1, false); // Under

        // Resolve with Under winning
        vm.warp(endTime);
        btcOracle.updateAnswer(94000_00000000);
        market.resolveMarket(1);

        // User1 (loser) tries to claim
        vm.prank(user1);
        vm.expectRevert("Not a winning bet");
        market.claimWinnings(1);
    }

    function testMultipleDailyMarkets() public {
        // Create first daily market
        vm.prank(owner);
        market.createDailyOverUnder(address(btcOracle), block.timestamp + 1 days);

        // Create second daily market
        vm.prank(owner);
        market.createDailyOverUnder(address(btcOracle), block.timestamp + 2 days);

        assertEq(market.getMarketCount(), 3); // 1 RACE + 2 DAILY

        PredictionMarket.Market memory mkt1 = market.getMarket(1);
        PredictionMarket.Market memory mkt2 = market.getMarket(2);

        assertEq(uint8(mkt1.marketType), uint8(PredictionMarket.MarketType.DAILY_OVER_UNDER));
        assertEq(uint8(mkt2.marketType), uint8(PredictionMarket.MarketType.DAILY_OVER_UNDER));
    }

    function testRaceMarketStillWorks() public {
        // Verify the original RACE market (market 0) still works correctly
        vm.prank(user1);
        market.placeBet{value: 2 ether}(0, true);

        vm.prank(user2);
        market.placeBet{value: 3 ether}(0, false);

        // Fast forward and update prices
        vm.warp(block.timestamp + 31 days);
        goldOracle.updateAnswer(5100_00000000);
        vm.warp(block.timestamp + 1);
        ethOracle.updateAnswer(4800_00000000);

        market.resolveMarket(0);

        PredictionMarket.Market memory mkt = market.getMarket(0);
        assertTrue(mkt.resolved);
        assertTrue(mkt.outcomeAWon);
        assertEq(uint8(mkt.marketType), uint8(PredictionMarket.MarketType.RACE));
    }

    function testDailyMarketCannotCreateWithPastEndTime() public {
        // Warp to a future time first, then go back
        vm.warp(block.timestamp + 10 days);
        uint256 pastTime = block.timestamp - 1 days;

        vm.prank(owner);
        vm.expectRevert("End time must be in future");
        market.createDailyOverUnder(address(btcOracle), pastTime);
    }

    function testDailyMarketRequiresValidOracle() public {
        vm.prank(owner);
        vm.expectRevert("Invalid oracle address");
        market.createDailyOverUnder(address(0), block.timestamp + 1 days);
    }

    function testDailyMarketCapturesCurrentPrice() public {
        // Update BTC price before creating market
        btcOracle.updateAnswer(100000_00000000); // $100,000

        vm.prank(owner);
        market.createDailyOverUnder(address(btcOracle), block.timestamp + 1 days);

        PredictionMarket.Market memory mkt = market.getMarket(1);
        assertEq(mkt.creationPrice, 100000_00000000, "Should capture current oracle price");
        assertEq(mkt.targetPrice, 100000_00000000, "Target should equal creation price");
    }
}