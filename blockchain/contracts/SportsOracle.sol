// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * @title SportsOracle
 * @dev Stores real-world sports data submitted by a trusted oracle.
 */
contract SportsOracle {
    address public oracleAddress;

    struct PlayerPerformance {
        uint256 pointsScored;
        bool finalized;
        bool exists;
    }

    // matchId => (playerId => PlayerPerformance)
    mapping(uint256 => mapping(uint256 => PlayerPerformance)) public performances;

    event DataSubmitted(uint256 indexed matchId, uint256 indexed playerId, uint256 pointsScored);
    event DataFinalized(uint256 indexed matchId, uint256 indexed playerId);

    modifier onlyOracle() {
        require(msg.sender == oracleAddress, "Only oracle can call");
        _;
    }

    constructor() {
        oracleAddress = msg.sender;
    }

    /**
     * @dev Allows the oracle to submit player performance data.
     */
    function submitPlayerData(uint256 matchId, uint256 playerId, uint256 pointsScored) external onlyOracle {
        require(!performances[matchId][playerId].finalized, "Data already finalized");
        
        performances[matchId][playerId] = PlayerPerformance({
            pointsScored: pointsScored,
            finalized: false,
            exists: true
        });

        emit DataSubmitted(matchId, playerId, pointsScored);
    }

    /**
     * @dev Allows the oracle to finalize match data, preventing further updates.
     */
    function finalizeMatch(uint256 matchId, uint256 playerId) external onlyOracle {
        require(performances[matchId][playerId].exists, "Data does not exist");
        require(!performances[matchId][playerId].finalized, "Data already finalized");

        performances[matchId][playerId].finalized = true;

        emit DataFinalized(matchId, playerId);
    }

    /**
     * @dev Helper to check if a player's data is finalized.
     */
    function isFinalized(uint256 matchId, uint256 playerId) external view returns (bool) {
        return performances[matchId][playerId].finalized;
    }

    /**
     * @dev Helper to get points scored.
     */
    function getPointsScored(uint256 matchId, uint256 playerId) external view returns (uint256) {
        require(performances[matchId][playerId].exists, "Data does not exist");
        return performances[matchId][playerId].pointsScored;
    }
}
