# Airdrop-App

A crypto airdrop is a promotional activity typically performed by blockchain-based startups to help bootstrap a virtual currency project. Its aim is to spread awareness about the cryptocurrency project and to get more people trading in it when it lists on an exchange as an initial coin offering (ICO). -By Investopedia
In this we provide an opportunity for whitelisted account to claim 1 airdrop-coin once per account and deny to pay airdrop-coin to already claimed account and those accounts that are not whitelisted

## Merkle Tree:-

A Merkle tree is a data structure that is used in computer science applications. In bitcoin and other cryptocurrencies​, Merkle trees serve to encode blockchain data more efficiently and securely. -By Investopedia

They are also referred to as "binary hash trees."
![Merkle Tree Diagram](https://www.freecodecamp.org/news/content/images/2022/10/Merkle-tree-structure.png)

## Technology Stack & Dependencies

- Solidity (Writing Smart Contract)
- HTML, Css, Javascript For the website
- [NodeJS](https://nodejs.org/en/) To install Dependencies
- [Hardhat](https://hardhat.org/) Ethereum development environment
- [Ethers.js](https://docs.ethers.io/v5/) To interact with the blockchain

### 1. Clone/Download the Repository and Install Dependencies:

```
$ cd web3
```

```
$ npm install or $ yarn
```

### 2. Test smart contract before deploying using:-

```
$ npx hardhat test
```

### 3. Deploy the two contracts to local host by using Hardhat in-built local blockchain

```
$ npx hardhat run --network localhost scripts/deploy.js
```
