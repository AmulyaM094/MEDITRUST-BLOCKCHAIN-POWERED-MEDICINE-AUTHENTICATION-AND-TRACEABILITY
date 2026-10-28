# 💊 MediTrust — Blockchain-Powered Medicine Authentication and Traceability

**MediTrust** is a blockchain-based web application designed to improve medicine traceability and help users verify medicine records. It uses Ethereum smart contracts to record medicine information on the blockchain, providing a transparent and tamper-resistant record of registered medicines.

The project demonstrates how blockchain technology can support pharmaceutical supply chain transparency and help address concerns about counterfeit medicines.

## 🚀 Project Overview

In traditional pharmaceutical supply chains, verifying a medicine's origin and tracking its movement can be challenging. MediTrust explores how blockchain technology can make medicine records easier to register and verify.

The application allows users to connect a crypto wallet, register medicine details, and retrieve recorded information using a unique medicine ID.

## ✨ Key Features

- 🔗 **Blockchain Integration:** Uses an Ethereum smart contract deployed on the Sepolia test network.
- 👛 **MetaMask Connectivity:** Connects the application to a user's MetaMask wallet.
- 💊 **Medicine Registration:** Records medicine IDs, names, manufacturers, batch numbers, manufacturing dates, and expiry dates.
- 🔍 **Medicine Verification:** Retrieves registered medicine information using its unique ID.
- 📦 **Traceability:** Demonstrates medicine-holder transfers through a smart contract.
- 🛡️ **Transparent Records:** Stores supported medicine records on the blockchain.
- 📱 **Responsive Interface:** Provides a user-friendly interface for medicine registration and verification.

## 🛠️ Technologies Used

- **Frontend:** React.js, JavaScript, HTML5, CSS3
- **Blockchain:** Ethereum, Solidity smart contracts
- **Wallet:** MetaMask
- **Web3 Library:** Ethers.js
- **Development Tools:** Visual Studio Code, Git, GitHub
- **Test Network:** Sepolia Ethereum Testnet

## ⚙️ How It Works

1. **Connect Wallet:** Connect MetaMask to the application.
2. **Select Network:** Switch MetaMask to the Sepolia test network.
3. **Register Medicine:** Enter the medicine's details and submit the registration transaction.
4. **Confirm Transaction:** Approve the transaction in MetaMask and wait for confirmation.
5. **Verify Medicine:** Enter the registered medicine ID to retrieve its recorded information.
6. **Track Transfers:** Use the smart contract's transfer functionality to demonstrate changes in the medicine holder.

## 📋 Prerequisites

Before running the project, make sure you have:

- Node.js and npm installed
- Git installed
- MetaMask browser extension
- Sepolia test ETH for transaction fees
- A deployed smart contract address and its matching ABI

## 💻 Installation and Setup

**1. Clone the repository**

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

Replace `YOUR_GITHUB_REPOSITORY_URL` with your actual repository URL.

**2. Open the project folder**

```bash
cd YOUR_PROJECT_FOLDER
```

**3. Install dependencies**

```bash
npm install
```

If the project uses a frontend subfolder, navigate into that folder before running the command.

**4. Start the development server**

```bash
npm run dev
```

Open the local URL displayed in the terminal, commonly `http://localhost:5173` for a Vite project.

**5. Connect MetaMask**

Open the website, connect your wallet, and select the Sepolia test network.

## 🔐 Smart Contract Functions

The current smart contract interface includes:

| Function | Purpose |
|---|---|
| `owner()` | Retrieves the contract owner's address. |
| `registerMedicine()` | Registers medicine information. |
| `verifyMedicine()` | Retrieves a medicine record and its status. |
| `transferMedicine()` | Updates the recorded medicine holder. |

## 🧪 Testing

For demonstration purposes, use clearly labelled sample medicine records and unique medicine IDs.

- Test medicine registration.
- Verify a registered medicine.
- Check the displayed manufacturing and expiry dates.
- Test wallet connection and network selection.
- Test medicine-holder transfer functionality.
- Check how the application handles unknown medicine IDs and failed transactions.

## 🔮 Future Enhancements

- QR-code-based medicine verification.
- Role-based access for manufacturers, distributors, pharmacies, and regulators.
- Improved supply chain tracking and transaction history.
- Integration with verified pharmaceutical data sources.
- Stronger validation of medicine and batch information.
- Secure storage and retrieval of supporting documents.
- A dashboard for tracking registered medicines and transfers.

## 🎯 Project Objective

The objective of MediTrust is to demonstrate how blockchain technology and smart contracts can support transparent medicine records, traceability, and verification in the pharmaceutical supply chain.

## 👥 Team Project

Developed as an academic blockchain project.

**Project Name:** MediTrust  
**Domain:** Blockchain, Web3, Healthcare Technology  
**Network:** Ethereum Sepolia Testnet

## 📄 Disclaimer

MediTrust is an educational prototype. It is not a certified medicine authentication service and should not be used to make medical or purchasing decisions. Medicine records must be checked against trusted manufacturer and regulatory sources.

---

⭐ If you find this project interesting, feel free to explore the repository and contribute ideas for improvement.
