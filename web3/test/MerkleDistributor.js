const { MerkleTree } = require("merkletreejs");
const KECCAK256 = require("keccak256"); // hashing algorithm library which converts string into a fixed length hash where same string has same hash and there is no way to go back from hash to string
const { expect } = require("chai");

describe("MerkleDistributor", () => {
  beforeEach(async () => {
    [signer1, signer2, signer3, signer4, signer5, signer6, signer7, signer8] =
      await ethers.getSigners(); // it's like 8 different wallets

    walletAddresses = [
      signer1,
      signer2,
      signer3,
      signer4,
      signer5,
      signer6,
      signer7,
      signer8,
    ].map((s) => s.address); // getting address of each wallet and assign it to `walletAddresses`

    leaves = walletAddresses.map((x) => KECCAK256(x)); // looping over the `walletAddresses` and passing each address through `KECCAK256` for hashing each address

    tree = new MerkleTree(leaves, KECCAK256, { sortPairs: true }); // creating a new `Merkle Tree` with the above hashed addresses as the leaves and
    // these are the very bottom nodes that go across the `Merkle Tree` see it here: https://en.wikipedia.org/wiki/Merkle_tree#/media/File:Hash_Tree.svg

    AirCoin = await ethers.getContractFactory("AirCoin", signer1); // Initializing Coin with `signer1` as it will be the owner of that address and be able to call them in function
    token = await AirCoin.deploy(); // Deploying

    MerkleDistributor = await ethers.getContractFactory(
      "MerkleDistributor",
      signer1
    ); // Initializing

    distributor = await MerkleDistributor.deploy(
      token.address,
      tree.getHexRoot(),
      500 // 500 wei AirCoin that will be airdropped to that account that claims tokens
    ); // deploying with arguments given in the `constructor()` in `MerkleDistributor.sol`

    // below minting `4000 wei` of our token and sending that to the address of our `MerkleDistributor` so that it has tokens to distribute
    await token.connect(signer1).mint(distributor.address, "4000");
  });

  // As we have 8 account addresses hashed as our leaves so we check the claim in below 1st test...
  // SO here we are going to call the `claim()` with the same wallet 2 times so that the first time it should work
  // and the second time it should fail as we only want to allow each wallet to claim the airdrop once...
  describe("8 account tree", () => {
    it("successful and unsuccessful claim", async () => {
      expect(await token.balanceOf(signer1.address)).to.be.equal(0);

      // here below we are creating `proof` which is a thing that we pass to the `Merkle Tree` to check if a wallet's address is included in that tree or not...
      const proof = tree.getHexProof(KECCAK256(signer1.address));

      await distributor.connect(signer1).claim(proof);

      expect(await token.balanceOf(signer1.address)).to.be.equal(500); // 500 wei AirCoin

      expect(distributor.connect(signer1).claim(proof)).to.be.revertedWith(
        "MerkleDistributor: Drop already claimed."
      ); // we except this to fail and revert with the error as specified...

      expect(await token.balanceOf(signer1.address)).to.be.equal(500);
    });

    it("unsuccessful claim", async () => {
      const generatedAddress = "0x4dE8dabfdc4D5A508F6FeA28C6f1B288bbdDc26e"; // address that was not included in our original Merkle Tree...
      const proof2 = tree.getHexProof(KECCAK256(generatedAddress));

      expect(distributor.connect(signer1).claim(proof2)).to.be.revertedWith(
        "MerkleDistributor: Invalid proof."
      );
    });

    it("emits a successful event", async () => {
      const proof = tree.getHexProof(KECCAK256(signer1.address));

      await expect(distributor.connect(signer1).claim(proof))
        .to.emit(distributor, "Claimed")
        .withArgs(signer1.address, 500);
    });
  });
});
