const { MerkleTree } = require("merkletreejs");
const KECCAK256 = require("keccak256");
const { BigNumber } = require("ethers"); // As we are going to distribute much bigger amount of our AirCoin token otherwise we'll get overflow errors
const fs = require("fs").promises; // importing `promises` from `node file system` as we're going to use this to write our whitelisted addresses to a separate json file within below asynchronous function...

async function main() {
  [signer1, signer2, signer3, signer4, signer5, signer6, signer7, signer8] =
    await ethers.getSigners();
  walletAddresses = [
    signer1,
    signer2,
    signer3,
    signer4,
    signer5,
    signer6,
    signer7,
    signer8,
  ].map((s) => s.address);
  leaves = walletAddresses.map((x) => KECCAK256(x));
  tree = new MerkleTree(leaves, KECCAK256, { sortPairs: true });

  // Initializing and Deploying `AirCoin`
  AirCoin = await ethers.getContractFactory("AirCoin", signer1);
  token = await AirCoin.deploy();

  // Initializing and Deploying `MerkleDistributor`
  MerkleDistributor = await ethers.getContractFactory(
    "MerkleDistributor",
    signer1
  );
  distributor = await MerkleDistributor.deploy(
    token.address,
    tree.getHexRoot(), // here we pass `HexRoot` of the `tree` as we need the same `tree`object to create the `proof`...
    // that we eventually send to the `claim()` in the `Merkle Proof` now it needs to be the same tree so the...
    // `tree` on the `frontend` generating the proofs needs to be the same tree that was used here generating the root that gets stored in our `MerkleDistributor.sol`
    // now instead of using the same tree we're going to rebuild a tree that will look exactly the same because we'll be building it with exactly the same wallet addresses in the frontend...
    // but this we would not do in the production but it is the easiest way to do it here... but few other options would be :-
    // 1. We could serialize this tree at the line of code `tree = new MerkleTree(leaves, KECCAK256, { sortPairs: true });` and then deserialize it on the frontend but Javascript doesn't have great libraries...
    // for serializing complex objects like in Python which do the same with pickle and for that we have to write custom code to deserialize it on the frontend
    // 2. If we could put `tree = new MerkleTree(leaves, KECCAK256, { sortPairs: true });` behind another external API and frontend could send the current wallet's address to that API and then API could do the calculation and
    // then it could return the `proof` so that `proof` and the tree wouldn't need to be built themselves in the frontend of this App..

    BigNumber.from("1000000000000000000") // As our token has 18 decimal places which means...
    // distributing `1 AirCoin` to each address which calls the `claim()` on our `Airdrop` Contract
  );

  // So for distributing the 1AirCoin token to each of 8 whitelisted address the `MerkleDistributor`...
  // must first have the token that's why minting `9 AirCoin` or 9 times the distributing amount.
  await token
    .connect(signer1)
    .mint(distributor.address, BigNumber.from("9000000000000000000")); // 9 AirCoin

  // We'll need some of the below `console.log` in our frontend code
  console.log("AirCoin:", token.address);
  console.log("MerkleDistributor:", distributor.address);
  console.log("signer1:", signer1.address);

  const indexedAddresses = {}; // creating empty object
  walletAddresses.map((x, idx) => (indexedAddresses[idx] = x)); // looping over the addresses that we got from `getSigners()` and adding them to our `indexedAddresses` object in key-value pair format

  const serializedAddresses = JSON.stringify(indexedAddresses); // serializing them by converting `indexedAddresses` into `string`

  await fs.writeFile("client/src/walletAddresses.json", serializedAddresses); // writing above value to a file so that we can place it at the given file location
}

// npx hardhat run --network localhost scripts/deploy.js

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
