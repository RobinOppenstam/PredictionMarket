// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PredictionUSD (pUSD)
 * @notice Stablecoin pegged to $1 USD for prediction market betting
 * @dev Simple ERC20 token with minting capability for faucet
 */
contract PredictionUSD is ERC20, Ownable {
    // Faucet address that can mint tokens
    address public faucet;

    event FaucetUpdated(address indexed oldFaucet, address indexed newFaucet);

    constructor() ERC20("Prediction USD", "pUSD") Ownable(msg.sender) {
        // Mint initial supply to deployer (10 million pUSD)
        _mint(msg.sender, 10_000_000 * 10**decimals());
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
