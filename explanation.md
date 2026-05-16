# 📝 Project Explanation: How it All Works

This project is a **Decentralized Sports Betting System**. In simple words, it's a way for people to bet on sports games using digital money (Ethereum) without needing a central middleman (like a traditional betting site).

---

## 🏗️ The 3 Main Parts

Imagine the project like a restaurant:

1.  **The Kitchen (Blockchain / Smart Contracts)**:
    - This is where all the logic lives.
    - It stores how much money people bet and knows who won.
    - It's "decentralized," meaning it runs on many computers and cannot be cheated.

2.  **The Waiter (Oracle Service)**:
    - This is the bridge. Since the "Kitchen" (Blockchain) cannot see what's happening in the real world (like a real NBA game), the Oracle fetches that data and tells the Kitchen the final score.
    - It's like a waiter bringing information from the outside world into the kitchen.

3.  **The Menu & Table (Frontend / Website)**:
    - This is what you see in your browser.
    - It's a nice website where you click buttons to connect your wallet, see games, and place your bets.

---

## 🔄 The Journey of a Bet (Step-by-Step)

1.  **Connecting**: You open the website and connect your MetaMask wallet. This is your digital ID and wallet.
2.  **Placing a Bet**: You choose a player (like LeBron James) and bet that he will score more than 25 points. You send some ETH to the smart contract. The contract holds your money safely.
3.  **The Game Happens**: In the real world, the game is played.
4.  **The Oracle Updates**: Our "Oracle Service" sends the real-world score to the blockchain. For example, it says: "LeBron scored 28 points."
5.  **Finalizing**: Once the game is over, the Oracle marks that game as "Finalized."
6.  **Getting Paid**: You click "Settle Bet" on the website. The smart contract checks: "Did LeBron score more than 25? Yes, he scored 28!"
7.  **Payout**: The contract automatically sends you **double** your money back! If you bet 0.1 ETH, you get 0.2 ETH.

---

## 🛠️ Tech Used (Simplified)

-   **Solidity**: The language used to write the "Kitchen" rules (Smart Contracts).
-   **TypeScript / Node.js**: Used to build the "Waiter" (Oracle Service).
-   **React**: Used to build the "Website" (Frontend).
-   **Docker**: A tool that packages everything into "containers" so it runs perfectly on any computer with just one command.

---

## 🎯 Why is this cool?
Because it's **Trustless**. You don't have to trust a company to pay you. The code (Smart Contract) is the law, and it pays you automatically as long as the Oracle provides the correct score!
--