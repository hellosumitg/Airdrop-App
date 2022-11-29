// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract MerkleDistributor {
    address public immutable token;
    bytes32 public immutable merkleRoot;
    uint256 public dropAmount; // It is the amount that wallet get if they're whitelisted and they call our `claim()`...

    // Below mapping store the list of addresses that have already claimed their tokens so that the same address can't claim tokens twice
    mapping(address => uint256) private addressesClaimed;

    // Event
    event Claimed(address indexed _from, uint256 _dropAmount);

    // below we are adding `dropAmount_` as constructor parameter so that we can specify the amount to drop to each wallet when the contract is deployed...
    constructor(
        address _token,
        bytes32 _merkleRoot,
        uint256 _dropAmount
    ) {
        token = _token;
        merkleRoot = _merkleRoot;
        dropAmount = _dropAmount;
    }

    // Below function allows address to claim their tokens
    function claim(bytes32[] calldata merkleProof) external {
        // below in require(), if an address hasn't been added with a value of `1` then the default value is `0`
        // which means the wallets hasn't claimed the tokens yet and they are good to get an airdrop of the tokens
        require(
            addressesClaimed[msg.sender] == 0,
            "MerkleDistributor: Drop already claimed."
        );

        // Verify the merkle proof...
        bytes32 node = keccak256(abi.encodePacked(msg.sender)); // creating a `node`
        // below we are verifying that the above created `node` is actually part of the `Merkle Tree` and we do this by calling `MerkleProof.verify(parameters...)`
        // This will tell us if the address calling this `claim()` is indeed one of the whitelisted  addresses...
        require(
            MerkleProof.verify(merkleProof, merkleRoot, node),
            "MerkleDistributor: Invalid proof."
        );

        // Mark it claimed and send the token.
        addressesClaimed[msg.sender] = 1;
        require(
            IERC20(token).transfer(msg.sender, dropAmount),
            "MerkleDistributor: Transfer failed."
        );

        emit Claimed(msg.sender, dropAmount);
    }
}
