// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface ISportsOracle {
    function isFinalized(uint256 matchId, uint256 playerId) external view returns (bool);
    function getPointsScored(uint256 matchId, uint256 playerId) external view returns (uint256);
}

/**
 * @title BettingMarket
 * @dev Manages betting markets based on oracle data.
 */
contract BettingMarket {
    ISportsOracle public oracle;

    struct Bet {
        address bettor;
        uint256 amount;
        uint256 matchId;
        uint256 playerId;
        uint256 predictedValue;
        bool settled;
        bool exists;
    }

    uint256 public nextBetId;
    mapping(uint256 => Bet) public bets;

    event BetPlaced(uint256 indexed betId, address indexed bettor, uint256 amount);
    event BetSettled(uint256 indexed betId, bool won, uint256 payout);

    constructor(address oracleAddress) {
        oracle = ISportsOracle(oracleAddress);
    }

    /**
     * @dev Allows users to place bets by sending Ether.
     */
    function placeBet(uint256 matchId, uint256 playerId, uint256 predictedValue) external payable {
        require(msg.value > 0, "Bet amount must be greater than 0");
        require(!oracle.isFinalized(matchId, playerId), "Match already finalized");

        uint256 betId = nextBetId++;
        bets[betId] = Bet({
            bettor: msg.sender,
            amount: msg.value,
            matchId: matchId,
            playerId: playerId,
            predictedValue: predictedValue,
            settled: false,
            exists: true
        });

        emit BetPlaced(betId, msg.sender, msg.value);
    }

    /**
     * @dev Settles a bet after the match is finalized.
     */
    function settleBet(uint256 betId) external {
        Bet storage bet = bets[betId];
        require(bet.exists, "Bet does not exist");
        require(!bet.settled, "Bet already settled");
        require(oracle.isFinalized(bet.matchId, bet.playerId), "Match not yet finalized");

        uint256 actualPoints = oracle.getPointsScored(bet.matchId, bet.playerId);
        bool won = actualPoints > bet.predictedValue;
        uint256 payout = 0;

        if (won) {
            payout = bet.amount * 2;
            require(address(this).balance >= payout, "Insufficient contract balance");
            (bool success, ) = payable(bet.bettor).call{value: payout}("");
            require(success, "Payout failed");
        }

        bet.settled = true;
        emit BetSettled(betId, won, payout);
    }

    // Fallback function to receive ETH
    receive() external payable {}
}
