
import { useState } from "react";
import { connectBlockchain } from "./blockchain";
import "./index.css";

const EMPTY_MEDICINE = {
  id: "",
  name: "",
  manufacturer: "",
  batchNumber: "",
  manufactureDate: "",
  expiryDate: "",
  activeIngredient: "",
  strength: "",
  dosageForm: "Tablet",
  category: "General medicine",
  packSize: "",
  storageInstructions: "",
  prescriptionStatus: "Unknown",
  productInfoUrl: "",
};

function App() {
  const [walletAddress, setWalletAddress] = useState("");
  const [contract, setContract] = useState(null);
  const [connectionMessage, setConnectionMessage] = useState("");
  const [connecting, setConnecting] = useState(false);

  const [medicine, setMedicine] = useState(EMPTY_MEDICINE);
  const [verifyId, setVerifyId] = useState("");
  const [result, setResult] = useState(null);

  const [registerMessage, setRegisterMessage] = useState("");
  const [verifyMessage, setVerifyMessage] = useState("");
  const [registering, setRegistering] = useState(false);
  const [verifying, setVerifying] = useState(false);

  function getErrorMessage(error) {
    if (error?.code === 4001) {
      return "Transaction rejected in MetaMask.";
    }

    return (
      error?.shortMessage ||
      error?.reason ||
      error?.message ||
      "Something went wrong. Please try again."
    );
  }

  async function handleConnectWallet() {
    try {
      setConnecting(true);
      setConnectionMessage("Connecting to MetaMask...");
      const connected = await connectBlockchain();

      setWalletAddress(connected.address);
      setContract(connected.contract);
      setConnectionMessage("Wallet connected successfully to Sepolia.");
    } catch (error) {
      console.error("Wallet connection:", error);
      setConnectionMessage(getErrorMessage(error));
    } finally {
      setConnecting(false);
    }
  }

  function handleClearWallet() {
    setWalletAddress("");
    setContract(null);
    setResult(null);
    setConnectionMessage(
      "Wallet cleared from this page. This does not revoke MetaMask site permissions."
    );
  }

  function handleMedicineChange(event) {
    const { name, value } = event.target;

    setMedicine((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function dateToTimestamp(dateString) {
    const milliseconds = Date.parse(`${dateString}T00:00:00Z`);

    if (!dateString || !Number.isFinite(milliseconds)) {
      throw new Error("Please enter valid manufacture and expiry dates.");
    }

    return BigInt(Math.floor(milliseconds / 1000));
  }

  function formatDate(timestamp) {
    const seconds = Number(timestamp);

    if (!Number.isFinite(seconds) || seconds <= 0) {
      return "Not provided";
    }

    return new Date(seconds * 1000).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    });
  }

  function loadSupplementaryDetails(id) {
    try {
      return JSON.parse(
        localStorage.getItem(`meditrust-demo-${id}`) || "{}"
      );
    } catch {
      return {};
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setRegisterMessage("");
    setResult(null);

    if (!contract || !walletAddress) {
      setRegisterMessage("Please connect MetaMask first.");
      return;
    }

    try {
      setRegistering(true);

      const id = medicine.id.trim();
      const name = medicine.name.trim();
      const manufacturer = medicine.manufacturer.trim();
      const batchNumber = medicine.batchNumber.trim();

      if (!id || !name || !manufacturer || !batchNumber) {
        throw new Error("Complete all required medicine fields.");
      }

      const manufactureTimestamp = dateToTimestamp(
        medicine.manufactureDate
      );
      const expiryTimestamp = dateToTimestamp(medicine.expiryDate);

      if (expiryTimestamp <= manufactureTimestamp) {
        throw new Error("Expiry date must be after manufacture date.");
      }

      setRegisterMessage("Please confirm the transaction in MetaMask.");

      const transaction = await contract.registerMedicine(
        id,
        name,
        manufacturer,
        batchNumber,
        manufactureTimestamp,
        expiryTimestamp
      );

      setRegisterMessage(
        `Transaction submitted: ${transaction.hash}. Waiting for confirmation...`
      );

      await transaction.wait();

      const supplementaryDetails = {
        activeIngredient: medicine.activeIngredient.trim(),
        strength: medicine.strength.trim(),
        dosageForm: medicine.dosageForm,
        category: medicine.category,
        packSize: medicine.packSize.trim(),
        storageInstructions: medicine.storageInstructions.trim(),
        prescriptionStatus: medicine.prescriptionStatus,
        productInfoUrl: medicine.productInfoUrl.trim(),
        savedAt: new Date().toISOString(),
        savedBy: walletAddress,
      };

      try {
        localStorage.setItem(
          `meditrust-demo-${id}`,
          JSON.stringify(supplementaryDetails)
        );
      } catch (storageError) {
        console.error("Could not save supplementary details:", storageError);
      }

      setRegisterMessage(
        `Registration transaction confirmed! Transaction hash: ${transaction.hash}`
      );
      setVerifyId(id);
    } catch (error) {
      console.error("Medicine registration:", error);
      setRegisterMessage(getErrorMessage(error));
    } finally {
      setRegistering(false);
    }
  }

  async function handleVerify(event) {
    event.preventDefault();
    setResult(null);
    setVerifyMessage("");

    if (!contract || !walletAddress) {
      setVerifyMessage("Connect MetaMask before verifying a medicine.");
      return;
    }

    const id = verifyId.trim();

    if (!id) {
      setVerifyMessage("Enter a medicine ID.");
      return;
    }

    try {
      setVerifying(true);
      setVerifyMessage("Reading the medicine record from Sepolia...");

      const data = await contract.verifyMedicine(id);

      const exists = Boolean(data.exists ?? data[7]);

      if (!exists) {
        setVerifyMessage("No registered medicine was found for this ID.");
        setResult({
          exists: false,
          id,
        });
        return;
      }

      const details = loadSupplementaryDetails(id);

      setResult({
        id: data.medicineId ?? data[0],
        name: data.name ?? data[1],
        manufacturer: data.manufacturer ?? data[2],
        batchNumber: data.batchNumber ?? data[3],
        manufactureDate: Number(data.manufactureDate ?? data[4]),
        expiryDate: Number(data.expiryDate ?? data[5]),
        currentHolder: data.currentHolder ?? data[6],
        exists,
        isExpired: Boolean(data.isExpired ?? data[8]),
        ...details,
      });

      setVerifyMessage("Medicine record retrieved successfully.");
    } catch (error) {
      console.error("Medicine verification:", error);
      setVerifyMessage(getErrorMessage(error));
    } finally {
      setVerifying(false);
    }
  }

  async function copyText(value, label) {
    try {
      await navigator.clipboard.writeText(value);
      setVerifyMessage(`${label} copied successfully.`);
    } catch {
      setVerifyMessage("Copy failed. Please select and copy the text manually.");
    }
  }

  const totalDays = result?.expiryDate
    ? Math.ceil(
        (result.expiryDate * 1000 - Date.now()) / 86400000
      )
    : null;

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-decoration decoration-one" />
        <div className="hero-decoration decoration-two" />

        <div className="hero-inner">
          <div className="brand-logo">✚</div>
          <p className="eyebrow hero-eyebrow">
            BLOCKCHAIN · HEALTHCARE · TRANSPARENCY
          </p>
          <h1>MediTrust</h1>
          <p className="hero-subtitle">
            Medicine Authentication &amp; Supply Chain Traceability
          </p>
          <div className="network-pill">
            <span className="network-dot" />
            Ethereum Sepolia Testnet
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="card wallet-card">
          <div className="section-heading">
            <div className="section-icon">◈</div>
            <div>
              <h2>Wallet Connection</h2>
              <p>Connect your wallet to access the smart contract.</p>
            </div>
            <span className={`connection-badge ${walletAddress ? "connected" : ""}`}>
              <span className="badge-dot" />
              {walletAddress ? "Connected" : "Not connected"}
            </span>
          </div>

          <button
            type="button"
            className="button primary-button"
            onClick={handleConnectWallet}
            disabled={connecting}
          >
            {connecting
              ? "Connecting..."
              : walletAddress
                ? "Reconnect Wallet"
                : "Connect MetaMask"}
          </button>

          {connectionMessage && (
            <div className="message" role="status">
              {connectionMessage}
            </div>
          )}

          {walletAddress && (
            <div className="wallet-details">
              <div className="wallet-avatar">W</div>
              <div className="wallet-text">
                <span className="field-caption">CONNECTED ACCOUNT</span>
                <strong className="wallet-address">{walletAddress}</strong>
              </div>
              <button
                type="button"
                className="button secondary-button"
                onClick={() => copyText(walletAddress, "Wallet address")}
              >
                Copy
              </button>
              <button
                type="button"
                className="button secondary-button"
                onClick={handleClearWallet}
              >
                Clear
              </button>
            </div>
          )}
        </section>

        <section className="welcome-section">
          <div>
            <p className="eyebrow">MEDICINE MANAGEMENT SYSTEM</p>
            <h2>Every medicine has a story.</h2>
            <p>
              Register product records and check information recorded by the
              MediTrust smart contract.
            </p>
          </div>
          <div className="welcome-icon" aria-hidden="true">✚</div>
        </section>

        <div className="feature-grid">
          <section className="card feature-card">
            <div className="feature-top">
              <div className="section-icon">＋</div>
              <span className="step-label">STEP 01 · REGISTER</span>
            </div>

            <h2>Register Medicine</h2>
            <p className="card-description">
              Add the batch information that will be recorded on the blockchain.
            </p>

            <form onSubmit={handleRegister}>
              <div className="form-section-title">Basic Information</div>

              <label htmlFor="medicine-id">Medicine ID *</label>
              <input
                id="medicine-id"
                name="id"
                value={medicine.id}
                onChange={handleMedicineChange}
                placeholder="e.g. MED-DEMO-1001"
                required
              />

              <label htmlFor="medicine-name">Medicine Name *</label>
              <input
                id="medicine-name"
                name="name"
                value={medicine.name}
                onChange={handleMedicineChange}
                placeholder="Enter the product name"
                required
              />

              <label htmlFor="manufacturer">Manufacturer *</label>
              <input
                id="manufacturer"
                name="manufacturer"
                value={medicine.manufacturer}
                onChange={handleMedicineChange}
                placeholder="Manufacturer name"
                required
              />

              <label htmlFor="batch-number">Batch Number *</label>
              <input
                id="batch-number"
                name="batchNumber"
                value={medicine.batchNumber}
                onChange={handleMedicineChange}
                placeholder="e.g. BATCH-DEMO-001"
                required
              />

              <div className="form-section-title">Manufacturing Details</div>

              <div className="date-grid">
                <div>
                  <label htmlFor="manufacture-date">Manufacture Date *</label>
                  <input
                    id="manufacture-date"
                    type="date"
                    name="manufactureDate"
                    value={medicine.manufactureDate}
                    onChange={handleMedicineChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="expiry-date">Expiry Date *</label>
                  <input
                    id="expiry-date"
                    type="date"
                    name="expiryDate"
                    value={medicine.expiryDate}
                    onChange={handleMedicineChange}
                    required
                  />
                </div>
              </div>

              <div className="form-section-title">Product Information</div>

              <label htmlFor="activeIngredient">Active Ingredient</label>
              <input
                id="activeIngredient"
                name="activeIngredient"
                value={medicine.activeIngredient}
                onChange={handleMedicineChange}
                placeholder="Ingredient listed on the label"
              />

              <label htmlFor="strength">Strength</label>
              <input
                id="strength"
                name="strength"
                value={medicine.strength}
                onChange={handleMedicineChange}
                placeholder="e.g. 500 mg (demo data)"
              />

              <label htmlFor="dosageForm">Dosage Form</label>
              <select
                id="dosageForm"
                name="dosageForm"
                value={medicine.dosageForm}
                onChange={handleMedicineChange}
              >
                <option>Tablet</option>
                <option>Capsule</option>
                <option>Syrup</option>
                <option>Injection</option>
                <option>Cream</option>
                <option>Drops</option>
                <option>Other</option>
              </select>

              <label htmlFor="category">Medicine Category</label>
              <select
                id="category"
                name="category"
                value={medicine.category}
                onChange={handleMedicineChange}
              >
                <option>General medicine</option>
                <option>Prescription medicine</option>
                <option>Over-the-counter medicine</option>
                <option>Vitamin or supplement</option>
                <option>Other</option>
              </select>

              <label htmlFor="packSize">Pack Size</label>
              <input
                id="packSize"
                name="packSize"
                value={medicine.packSize}
                onChange={handleMedicineChange}
                placeholder="e.g. 10 tablets per strip"
              />

              <label htmlFor="storageInstructions">Storage Instructions</label>
              <textarea
                id="storageInstructions"
                name="storageInstructions"
                value={medicine.storageInstructions}
                onChange={handleMedicineChange}
                placeholder="Enter instructions from the product label"
                rows={3}
              />

              <label htmlFor="prescriptionStatus">Prescription Status</label>
              <select
                id="prescriptionStatus"
                name="prescriptionStatus"
                value={medicine.prescriptionStatus}
                onChange={handleMedicineChange}
              >
                <option>Unknown</option>
                <option>Prescription required</option>
                <option>Non-prescription</option>
              </select>

              <label htmlFor="productInfoUrl">
                Official Product Information URL
              </label>
              <input
                id="productInfoUrl"
                type="url"
                name="productInfoUrl"
                value={medicine.productInfoUrl}
                onChange={handleMedicineChange}
                placeholder="https://..."
              />

              <p className="helper-text">
                * Required for the blockchain transaction. Additional fields
                are supplementary browser-stored demo information.
              </p>

              <button
                type="submit"
                className="button primary-button full-button"
                disabled={registering}
              >
                {registering ? "Processing transaction..." : "Register on Blockchain"}
              </button>
            </form>

            {registerMessage && (
              <div className="message" role="status">
                {registerMessage}
              </div>
            )}
          </section>

          <section className="card feature-card verification-card">
            <div className="feature-top">
              <div className="section-icon">⌕</div>
              <span className="step-label">STEP 02 · VERIFY</span>
            </div>

            <h2>Verify Medicine</h2>
            <p className="card-description">
              Retrieve the medicine record using its registered ID.
            </p>

            <form onSubmit={handleVerify}>
              <label htmlFor="verify-id">Medicine ID</label>
              <input
                id="verify-id"
                value={verifyId}
                onChange={(event) => setVerifyId(event.target.value)}
                placeholder="Enter a registered medicine ID"
                required
              />

              <button
                type="submit"
                className="button primary-button full-button"
                disabled={verifying}
              >
                {verifying ? "Verifying..." : "Verify Medicine"}
              </button>
            </form>

            {verifyMessage && (
              <div className="message" role="status">
                {verifyMessage}
              </div>
            )}

            {result && !result.exists && (
              <div className="not-found">
                <span className="not-found-icon">!</span>
                <div>
                  <strong>Record not found</strong>
                  <p>No registered record was returned for ID: {result.id}</p>
                </div>
              </div>
            )}

            {result?.exists && (
              <div className="verification-result">
                <div className="result-heading">
                  <div>
                    <span className="field-caption">MEDICINE REPORT</span>
                    <h3>{result.name}</h3>
                    <p>{result.manufacturer}</p>
                  </div>
                  <span className="registered-badge">✓ Registered</span>
                </div>

                <div className="medicine-id-box">
                  <div>
                    <span className="field-caption">MEDICINE IDENTIFIER</span>
                    <strong>{result.id}</strong>
                  </div>
                  <button
                    type="button"
                    className="button secondary-button"
                    onClick={() => copyText(result.id, "Medicine ID")}
                  >
                    Copy ID
                  </button>
                </div>

                <div className={`expiry-panel ${result.isExpired ? "expired" : "valid"}`}>
                  <div className="expiry-icon">
                    {result.isExpired ? "!" : "✓"}
                  </div>
                  <div className="expiry-text">
                    <strong>
                      {result.isExpired ? "Expired" : "Not expired"}
                    </strong>
                    <span>Expiry date: {formatDate(result.expiryDate)}</span>
                    {totalDays !== null && (
                      <small>
                        {totalDays < 0
                          ? `${Math.abs(totalDays)} days past expiry`
                          : totalDays === 0
                            ? "Expiry date is today"
                            : `${totalDays} days until expiry`}
                      </small>
                    )}
                  </div>
                </div>

                <h4 className="details-heading">Batch Information</h4>
                <div className="result-grid">
                  <div className="result-item">
                    <span>Manufacturer</span>
                    <strong>{result.manufacturer}</strong>
                  </div>
                  <div className="result-item">
                    <span>Batch Number</span>
                    <strong>{result.batchNumber}</strong>
                  </div>
                  <div className="result-item">
                    <span>Manufacture Date</span>
                    <strong>{formatDate(result.manufactureDate)}</strong>
                  </div>
                  <div className="result-item">
                    <span>Expiry Date</span>
                    <strong>{formatDate(result.expiryDate)}</strong>
                  </div>
                </div>

                <h4 className="details-heading">Additional Product Details</h4>
                <div className="result-grid">
                  <div className="result-item">
                    <span>Active Ingredient</span>
                    <strong>{result.activeIngredient || "Not provided"}</strong>
                  </div>
                  <div className="result-item">
                    <span>Strength</span>
                    <strong>{result.strength || "Not provided"}</strong>
                  </div>
                  <div className="result-item">
                    <span>Dosage Form</span>
                    <strong>{result.dosageForm || "Not provided"}</strong>
                  </div>
                  <div className="result-item">
                    <span>Category</span>
                    <strong>{result.category || "Not provided"}</strong>
                  </div>
                  <div className="result-item">
                    <span>Pack Size</span>
                    <strong>{result.packSize || "Not provided"}</strong>
                  </div>
                  <div className="result-item">
                    <span>Prescription Status</span>
                    <strong>{result.prescriptionStatus || "Unknown"}</strong>
                  </div>
                  <div className="result-item full-width">
                    <span>Storage Instructions</span>
                    <strong>{result.storageInstructions || "Not provided"}</strong>
                  </div>
                </div>

                {result.productInfoUrl && (
                  <a
                    className="product-link"
                    href={result.productInfoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View product information ↗
                  </a>
                )}

                <h4 className="details-heading">Blockchain Information</h4>
                <div className="holder-box">
                  <span className="field-caption">CURRENT HOLDER</span>
                  <strong className="holder-address">{result.currentHolder}</strong>
                  <button
                    type="button"
                    className="button secondary-button"
                    onClick={() => copyText(result.currentHolder, "Holder address")}
                  >
                    Copy Wallet Address
                  </button>
                </div>

                <div className="trust-note">
                  <strong>ⓘ Understand this result</strong>
                  <p>
                    Registered status confirms that the smart contract returned
                    an existing record. Supplementary details come from this
                    browser and are not independently verified. This result
                    alone does not prove the physical medicine is genuine or safe.
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>

        <section className="info-strip">
          <div className="info-symbol">✓</div>
          <div>
            <strong>Transparent records. Better traceability.</strong>
            <p>
              MediTrust is an educational blockchain demonstration. Use verified
              manufacturer information and appropriate regulatory checks before
              relying on any medicine details.
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <strong>MediTrust</strong>
        <span>Blockchain-Powered Medicine Authentication</span>
        <span>Sepolia Testnet · Educational Demo</span>
      </footer>
    </div>
  );
}

export default App;
