# 📋 Questionnaire Answers: Decentralized Betting System

These answers are based on the current implementation of the project.

### 1. Explain the trade-offs of the single-oracle design used in this project. What are the main risks, and how would you evolve the architecture to a more decentralized and trust-minimized system?

**Current Design**: Our project uses one `oracleAddress` in the `SportsOracle.sol` contract. 
-   **Trade-off**: It is very simple to build and costs less "gas" because only one transaction is needed to update the score.
-   **Risks**: 
    -   **Single Point of Failure**: If the computer running the oracle service crashes, no one can settle their bets.
    -   **Data Manipulation**: If someone steals the oracle's private key, they can lie about the scores and steal the money.
    -   **Censorship**: The person running the oracle can choose to never finalize a match if they don't want to pay the winners.
-   **Evolution**: I would move to a **Decentralized Oracle Network (DON)**. Instead of one oracle, I would have 5 or 7 different oracles. The smart contract would only accept a score if at least 51% of them agree on the same number.

### 2. How did you manage the oracle's private key during development? What security measures would you implement to protect this key in a production environment?

**Current Design**: I used a `.env` file in the `oracle-service` folder to store the private key. I also added `.env` to the `.gitignore` file so that the key is never uploaded to GitHub.
-   **Production Security**: 
    -   **KMS (Key Management Service)**: Instead of a file, I would use AWS KMS or Google Cloud KMS. These services store keys in secure hardware and never show the actual key to anyone, even the developers.
    -   **HSM (Hardware Security Module)**: I would use specialized hardware designed specifically to protect digital keys from physical and digital theft.
    -   **Vaults**: Using tools like HashiCorp Vault to manage secrets and rotate keys automatically.

### 3. Why is the concept of 'finalizing' data crucial in this betting application? What could go wrong if bets could be settled before the oracle finalizes the result?

**Importance**: In our `BettingMarket.sol`, the `settleBet` function checks `oracle.isFinalized`. 
-   **Why it's crucial**: It ensures the game is actually over and the score is official.
-   **What could go wrong**: If users could settle bets early, they might settle based on "temporary" data. For example, a player might have 30 points mid-game, but the official scorekeeper later removes 2 points due to a mistake. If a user settled early, they would win money they didn't actually earn. Finalization prevents "settling on a moving target."

### 4. Describe your strategy for handling potential failures or inconsistencies from the external sports API. How does your oracle service ensure data reliability?

**Current Strategy**: The current oracle uses TypeScript with robust error handling (`try/catch` blocks) and transaction receipt verification (`tx.wait()`).
-   **Reliability Strategy**:
    -   **Retry Logic**: If the API fails, the service should wait (exponential backoff) and try again later.
    -   **Multi-Source Fallback**: If the primary sports API is down, the service should automatically switch to a secondary API (like fetching from a different sports data provider).
    -   **Validation**: The oracle should check if the data makes sense (e.g., a player scoring 500 points in one game is likely an API error and should be flagged).

### 5. What are the primary scalability bottlenecks for this application, both on-chain and off-chain? How would you address them if the platform needed to support thousands of concurrent users and markets?

-   **On-chain Bottlenecks**: High gas fees on the Ethereum network. Every bet and payout is a transaction. 
    -   **Solution**: Deploy the contracts on a **Layer 2 (L2)** network like Arbitrum or Optimism, where transactions are 100x cheaper.
-   **Off-chain Bottlenecks**: A single Oracle server cannot track thousands of games at the same time without slowing down.
    -   **Solution**: Scale the Oracle service using **Serverless Functions (like AWS Lambda)** that can run in parallel for every game. Also, implement **API Rate Limiting management** and caching to handle thousands of data requests without getting blocked by the sports data provider.
