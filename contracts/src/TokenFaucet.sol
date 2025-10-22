// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IMintable {
    function mint(address to, uint256 amount) external;
}

/**
 * @title TokenFaucet
 * @notice Faucet for distributing pUSD tokens
 * @dev Users can claim tokens once every 24 hours
 */
contract TokenFaucet is Ownable, ReentrancyGuard {
    IMintable public pUSD;

    uint256 public constant CLAIM_AMOUNT_pUSD = 10000 * 10**18; // 10000 pUSD
    uint256 public constant CLAIM_COOLDOWN = 24 hours;

    // Track last claim time for each address
    mapping(address => uint256) public lastClaimTime;

    event TokensClaimed(
        address indexed user,
        uint256 pUsdAmount,
        uint256 timestamp
    );

    event TokenUpdated(address indexed pUsd);

    constructor(address _pUSD) Ownable(msg.sender) {
        require(_pUSD != address(0), "Invalid token address");
        pUSD = IMintable(_pUSD);
    }

    /**
     * @notice Check if an address can claim tokens
     * @param user Address to check
     * @return able Whether the user can claim
     * @return timeUntilNextClaim Seconds until next claim (0 if can claim now)
     */
    function canClaim(address user) public view returns (bool able, uint256 timeUntilNextClaim) {
        uint256 timeSinceLastClaim = block.timestamp - lastClaimTime[user];

        if (timeSinceLastClaim >= CLAIM_COOLDOWN) {
            return (true, 0);
        } else {
            return (false, CLAIM_COOLDOWN - timeSinceLastClaim);
        }
    }

    /**
     * @notice Claim tokens from the faucet
     * @dev Can only claim once every 24 hours
     */
    function claim() external nonReentrant {
        (bool able, uint256 timeLeft) = canClaim(msg.sender);
        require(able, string(abi.encodePacked("Must wait ", _toString(timeLeft), " seconds")));

        lastClaimTime[msg.sender] = block.timestamp;

        // Mint tokens to user
        pUSD.mint(msg.sender, CLAIM_AMOUNT_pUSD);

        emit TokensClaimed(msg.sender, CLAIM_AMOUNT_pUSD, block.timestamp);
    }

    /**
     * @notice Update token address (admin only)
     * @param _pUSD New pUSD token address
     */
    function setToken(address _pUSD) external onlyOwner {
        require(_pUSD != address(0), "Invalid token address");
        pUSD = IMintable(_pUSD);
        emit TokenUpdated(_pUSD);
    }

    /**
     * @notice Reset claim time for a user (admin only, for testing)
     * @param user Address to reset
     */
    function resetClaimTime(address user) external onlyOwner {
        lastClaimTime[user] = 0;
    }

    /**
     * @notice Convert uint to string
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
