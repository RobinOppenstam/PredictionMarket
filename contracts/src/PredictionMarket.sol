// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PredictionMarket is Ownable, ReentrancyGuard {
    struct Market {
        string name;
        string outcomeA;
        string outcomeB;
        address oracleA;
        address oracleB;
        int256 targetPrice;
        uint256 totalPoolA;
        uint256 totalPoolB;
        uint256 endTime;
        bool resolved;
        bool outcomeAWon;
        uint256 fee; // Fee in basis points (e.g., 200 = 2%)
    }

    struct Bet {
        uint256 amount;
        bool betOnA;
    }

    Market[] public markets;
    mapping(uint256 => mapping(address => Bet)) public bets;
    
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public protocolFee = 200; // 2% default fee
    address public feeCollector;

    event MarketCreated(
        uint256 indexed marketId,
        string name,
        string outcomeA,
        string outcomeB,
        int256 targetPrice,
        uint256 endTime
    );
    
    event BetPlaced(
        uint256 indexed marketId,
        address indexed user,
        bool betOnA,
        uint256 amount
    );
    
    event MarketResolved(
        uint256 indexed marketId,
        bool outcomeAWon,
        int256 priceA,
        int256 priceB
    );
    
    event WinningsClaimed(
        uint256 indexed marketId,
        address indexed user,
        uint256 amount
    );

    constructor() Ownable(msg.sender) {
        feeCollector = msg.sender;
    }

    function createMarket(
        string memory _name,
        string memory _outcomeA,
        string memory _outcomeB,
        address _oracleA,
        address _oracleB,
        int256 _targetPrice,
        uint256 _durationInDays
    ) external onlyOwner {
        require(_oracleA != address(0) && _oracleB != address(0), "Invalid oracle addresses");
        require(_targetPrice > 0, "Target price must be positive");
        require(_durationInDays > 0, "Duration must be positive");

        uint256 endTime = block.timestamp + (_durationInDays * 1 days);

        markets.push(Market({
            name: _name,
            outcomeA: _outcomeA,
            outcomeB: _outcomeB,
            oracleA: _oracleA,
            oracleB: _oracleB,
            targetPrice: _targetPrice,
            totalPoolA: 0,
            totalPoolB: 0,
            endTime: endTime,
            resolved: false,
            outcomeAWon: false,
            fee: protocolFee
        }));

        emit MarketCreated(
            markets.length - 1,
            _name,
            _outcomeA,
            _outcomeB,
            _targetPrice,
            endTime
        );
    }

    function placeBet(uint256 _marketId, bool _betOnA) external payable nonReentrant {
        require(_marketId < markets.length, "Market does not exist");
        require(msg.value > 0, "Bet amount must be greater than 0");
        
        Market storage market = markets[_marketId];
        require(block.timestamp < market.endTime, "Market has ended");
        require(!market.resolved, "Market already resolved");

        Bet storage userBet = bets[_marketId][msg.sender];
        
        if (userBet.amount > 0) {
            require(userBet.betOnA == _betOnA, "Cannot bet on both outcomes");
            userBet.amount += msg.value;
        } else {
            userBet.amount = msg.value;
            userBet.betOnA = _betOnA;
        }

        if (_betOnA) {
            market.totalPoolA += msg.value;
        } else {
            market.totalPoolB += msg.value;
        }

        emit BetPlaced(_marketId, msg.sender, _betOnA, msg.value);
    }

    function resolveMarket(uint256 _marketId) external nonReentrant {
        require(_marketId < markets.length, "Market does not exist");

        Market storage market = markets[_marketId];
        require(!market.resolved, "Market already resolved");

        (int256 priceA, uint256 timestampA) = getLatestPrice(market.oracleA);
        (int256 priceB, uint256 timestampB) = getLatestPrice(market.oracleB);

        require(timestampA > 0 && timestampB > 0, "Invalid oracle data");

        bool outcomeAWon;
        bool canResolve = false;

        // Check if either asset has reached the target price (early resolution)
        if (priceA >= market.targetPrice || priceB >= market.targetPrice) {
            canResolve = true;

            if (priceA >= market.targetPrice && priceB >= market.targetPrice) {
                // Both hit target - winner is whoever hit it first (based on oracle timestamp)
                outcomeAWon = timestampA <= timestampB;
            } else if (priceA >= market.targetPrice) {
                outcomeAWon = true;
            } else {
                outcomeAWon = false;
            }
        }
        // Check if deadline has passed (fallback resolution)
        else if (block.timestamp >= market.endTime) {
            canResolve = true;
            // Neither hit target - winner is whoever got closest
            int256 diffA = market.targetPrice - priceA;
            int256 diffB = market.targetPrice - priceB;
            outcomeAWon = diffA <= diffB;
        }

        require(canResolve, "Market cannot be resolved yet - target not reached and deadline not passed");

        market.resolved = true;
        market.outcomeAWon = outcomeAWon;

        emit MarketResolved(_marketId, outcomeAWon, priceA, priceB);
    }

    function claimWinnings(uint256 _marketId) external nonReentrant {
        require(_marketId < markets.length, "Market does not exist");
        
        Market storage market = markets[_marketId];
        require(market.resolved, "Market not resolved yet");

        Bet storage userBet = bets[_marketId][msg.sender];
        require(userBet.amount > 0, "No bet placed");
        require(userBet.betOnA == market.outcomeAWon, "Not a winning bet");

        uint256 winningPool = market.outcomeAWon ? market.totalPoolA : market.totalPoolB;
        uint256 losingPool = market.outcomeAWon ? market.totalPoolB : market.totalPoolA;

        require(winningPool > 0, "No winning pool");

        uint256 userShare = (userBet.amount * losingPool) / winningPool;
        uint256 feeAmount = (userShare * market.fee) / FEE_DENOMINATOR;
        uint256 totalPayout = userBet.amount + userShare - feeAmount;

        userBet.amount = 0;

        (bool successUser, ) = payable(msg.sender).call{value: totalPayout}("");
        require(successUser, "Transfer to user failed");

        if (feeAmount > 0) {
            (bool successFee, ) = payable(feeCollector).call{value: feeAmount}("");
            require(successFee, "Transfer to fee collector failed");
        }

        emit WinningsClaimed(_marketId, msg.sender, totalPayout);
    }

    function getLatestPrice(address _oracle) public view returns (int256, uint256) {
        AggregatorV3Interface priceFeed = AggregatorV3Interface(_oracle);
        (
            , 
            int256 price,
            ,
            uint256 updatedAt,
            
        ) = priceFeed.latestRoundData();
        
        return (price, updatedAt);
    }

    function getMarketOdds(uint256 _marketId) external view returns (
        uint256 oddsA,
        uint256 oddsB,
        uint256 totalPool
    ) {
        require(_marketId < markets.length, "Market does not exist");
        Market storage market = markets[_marketId];
        
        totalPool = market.totalPoolA + market.totalPoolB;
        
        if (totalPool == 0) {
            return (5000, 5000, 0); // 50-50 if no bets
        }
        
        oddsA = (market.totalPoolA * 10000) / totalPool;
        oddsB = (market.totalPoolB * 10000) / totalPool;
    }

    function getUserBet(uint256 _marketId, address _user) external view returns (
        uint256 amount,
        bool betOnA,
        bool hasBet
    ) {
        Bet storage userBet = bets[_marketId][_user];
        return (userBet.amount, userBet.betOnA, userBet.amount > 0);
    }

    function getMarketCount() external view returns (uint256) {
        return markets.length;
    }

    function getMarket(uint256 _marketId) external view returns (Market memory) {
        require(_marketId < markets.length, "Market does not exist");
        return markets[_marketId];
    }

    function setProtocolFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee too high"); // Max 10%
        protocolFee = _fee;
    }

    function setFeeCollector(address _feeCollector) external onlyOwner {
        require(_feeCollector != address(0), "Invalid address");
        feeCollector = _feeCollector;
    }

    receive() external payable {}
}