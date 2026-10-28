import { BrowserProvider, Contract } from "ethers";
import abiJson from "./contractABI.json";

const CONTRACT_ADDRESS = "0x8Ba4A8B76661c24d28d72EC26f3a5044716B80b8";

const CONTRACT_ABI = Array.isArray(abiJson)
  ? abiJson
  : abiJson.abi;

export async function connectBlockchain() {
  if (!window.ethereum) {
    throw new Error(
      "MetaMask is not installed. Please install MetaMask."
    );
  }

  const provider = new BrowserProvider(window.ethereum);

  await provider.send("eth_requestAccounts", []);

  const network = await provider.getNetwork();

  if (network.chainId !== 11155111n) {
    throw new Error(
      "Please switch MetaMask to Sepolia Test Network."
    );
  }

  const signer = await provider.getSigner();

  const contract = new Contract(
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    signer
  );

  return {
    address: await signer.getAddress(),
    contract,
  };
}