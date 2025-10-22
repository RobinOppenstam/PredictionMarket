// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

/**
 * @title PredictionETH (pETH)
 * @notice Token that mirrors the real-time value of ETH for prediction market betting
 * @dev Each pETH represents 1 ETH worth of value in USD terms
 */
contract PredictionETH is ERC20, Ownable {
    // Faucet address that can mint tokens
    address public faucet;

    // Chainlink ETH/USD price feed
    AggregatorV3Interface public ethUsdPriceFeed;

    event FaucetUpdated(address indexed oldFaucet, address indexed newFaucet);
    event PriceFeedUpdated(address indexed oldFeed, address indexed newFeed);

    constructor(address _ethUsdPriceFeed) ERC20("Prediction ETH", "pETH") Ownable(msg.sender) {
        require(_ethUsdPriceFeed != address(0), "Invalid price feed");
        ethUsdPriceFeed = AggregatorV3Interface(_ethUsdPriceFeed);

        // Mint initial supply to deployer (10,000 pETH)
        _mint(msg.sender, 10_000 * 10**decimals());
    }

    /**
     * @notice Set the faucet address that can mint tokens
     * @param _faucet Address of the faucet contract
     */
    function setFaucet(address _faucet) external onlyOwner {
        require(_faucet != address(0), "Invalid faucet address");
        address oldFaucet = faucet;
        faucet = _faucet;
        emit FaucetUpdated(oldFaucet, _faucet);
    }

    /**
     * @notice Update the ETH/USD price feed
     * @param _ethUsdPriceFeed New price feed address
     */
    function setPriceFeed(address _ethUsdPriceFeed) external onlyOwner {
        require(_ethUsdPriceFeed != address(0), "Invalid price feed");
        address oldFeed = address(ethUsdPriceFeed);
        ethUsdPriceFeed = AggregatorV3Interface(_ethUsdPriceFeed);
        emit PriceFeedUpdated(oldFeed, _ethUsdPriceFeed);
    }

    /**
     * @notice Get the current USD value of pETH
     * @return price Current price of ETH in USD (8 decimals)
     * @return timestamp Last update timestamp
     */
    function getEthUsdPrice() public view returns (int256 price, uint256 timestamp) {
        (
            ,
            int256 answer,
            ,
            uint256 updatedAt,

        ) = ethUsdPriceFeed.latestRoundData();

        return (answer, updatedAt);
    }

    /**
     * @notice Mint tokens - only callable by faucet
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external {
        require(msg.sender == faucet, "Only faucet can mint");
        _mint(to, amount);
    }

    /**
     * @notice Burn tokens from caller
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
