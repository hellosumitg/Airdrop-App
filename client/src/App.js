import { useEffect, useState } from "react";
import { ethers } from "ethers";
import KECCAK256 from "keccak256";
import MerkleTree from "merkletreejs";
import { Buffer } from "buffer/"; // Using Buffer as there is some dependency issue with `react scripts`

import "./App.css";

import artifact from "./artifacts/contracts/MerkleDistributor.sol/MerkleDistributor.json";
const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // `MerkleDistributor.sol` deployed address

window.Buffer = window.Buffer || Buffer;

function App() {
  const [provider, setProvider] = useState(undefined); // provider is a non-wallet specific way for interacting with our contract
  const [signer, setSigner] = useState(undefined); // signer is a wallet specific way for interacting with our contract
  const [contract, setContract] = useState(undefined); // this is used for initializing `MerkleDistributor.sol` in the frontend
  const [signerAddress, setSignerAddress] = useState(undefined); // address of the wallet that is currently interacting with our App
  const [tree, setTree] = useState(undefined); // used for creating Merkle tree
  const [proof, setProof] = useState([]); // here `proof` will be different and depends on: which address is interacting with the frontend

  // below `useEffect()` will run when the app renders i.e it will run before the user interacts with the app...
  useEffect(() => {
    const onLoad = async () => {
      const provider = await new ethers.providers.Web3Provider(window.ethereum); // setting up the provider
      setProvider(provider);

      // initializing our `MerkleDistributor` contract
      const contract = await new ethers.Contract(
        CONTRACT_ADDRESS,
        artifact.abi,
        provider
      );
      setContract(contract);

      // creating our tree
      const tree = await getTree();
      setTree(tree);
    };
    onLoad();
  }, []);

  const isConnected = () => signer !== undefined;

  // below `connect()` connects the signer of the current wallet when he/she clicks on the `Connect Metamask` button of our App
  const connect = () => {
    getSigner(provider).then((signer) => {
      setSigner(signer);
    });
  };

  const getTree = async () => {
    const indexedAddresses = require("./walletAddresses.json"); // getting the addresses data from `walletAddresses.json`

    const addresses = [];
    Object.keys(indexedAddresses).forEach(function (idx) {
      addresses.push(indexedAddresses[idx]); // looping over the addresses data which are in the `json` format and store them in an array
    });

    // As we did in our `test` and `deploy` scripts here we generate leaves by looping over the address and hashing each one of them with `keccak256`
    // and generate tree with our leaves using the same hashing algorithm and sorting them to get the final tree...
    const leaves = addresses.map((x) => KECCAK256(x));
    const tree = new MerkleTree(leaves, KECCAK256, { sortPairs: true });

    return tree; // this tree is used to generate the proofs in the frontend which get sent to the `claim()` on our contract in the backend
  };

  const getSigner = async (provider) => {
    const signer = provider.getSigner(); // here it gets the `signer`

    // below app gets the `address` of the `signer`
    await signer.getAddress().then((address) => {
      setSignerAddress(address);

      const proof = tree.getHexProof(KECCAK256(address)); // generating the `proofs` for the `address` by using this `getHexProof()` on the tree and...
      // passing it in the current wallets hashed address...
      setProof(proof);
    });

    return signer;
  };

  // below `claimAirdrop()` which uses the current signer or current connected wallet and calls the `claim()` from the contract and pass on the `proof` that we just  generated,
  // which gets triggered when someone clicks on the `Claim` button which is displayed on the UI of our App
  const claimAirdrop = async () => {
    await contract.connect(signer).claim(proof);
  };

  return (
    <div className="App">
      <header className="App-header">
        {isConnected() ? (
          <div>
            <p>Welcome {signerAddress?.substring(0, 10)}...</p>
            <div className="list-group">
              <div className="list-group-item">
                <button
                  className="btn btn-success"
                  onClick={() => claimAirdrop()}
                >
                  Claim
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p>You are not connected</p>
            <button onClick={connect} className="btn btn-primary">
              Connect Metamask
            </button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
