
const medicineForm = document.getElementById("medicineForm");
const medicineInput = document.getElementById("medicineName");
const statusMessage = document.getElementById("status");
const resultsDiv = document.getElementById("results");
const searchBtn = document.getElementById("searchBtn");

const FDA_API = "https://api.fda.gov/drug/label.json";

function normalizeName(value) {
    return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getSearchNames(name) {
    const normalized = normalizeName(name);

    if (normalized === "paracetamol" ||
        normalized === "acetaminophen") {
        return ["acetaminophen", "paracetamol"];
    }

    return [name];
}

function getMatchScore(record, searchTerm) {
    const openfda = record.openfda || {};
    const brands = (openfda.brand_name || []).map(normalizeName);
    const generics = (openfda.generic_name || []).map(normalizeName);

    let score = 0;

    if (generics.includes(searchTerm)) score += 100;
    if (brands.includes(searchTerm)) score += 100;
    if (generics.some(n => n.startsWith(searchTerm))) score += 50;
    if (brands.some(n => n.startsWith(searchTerm))) score += 50;
    if (generics.some(n => n.includes(searchTerm))) score += 20;
    if (brands.some(n => n.includes(searchTerm))) score += 20;

    return score;
}

function getSimpleExplanation(record, medicineName) {
    const indications = record.indications_and_usage || [];
    const purposes = record.purpose || [];

    const text = [...indications, ...purposes]
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

    if (!text) {
        return `No simple usage explanation is available for ${medicineName}.`;
    }

    const firstSentence = text.match(/^[\s\S]*?[.!?](?=\s|$)/);

    if (firstSentence) return firstSentence[0].trim();

    return text.length > 250 ? text.slice(0, 250) + "..." : text;
}

function addDetail(container, label, value) {
    const row = document.createElement("p");
    row.className = "medicine-detail";

    const strong = document.createElement("strong");
    strong.textContent = `${label}: `;

    const span = document.createElement("span");
    span.textContent = value;

    row.append(strong, span);
    container.appendChild(row);
}

async function fetchRecords(field, name) {
    const query = `${field}:${JSON.stringify(name)}`;
    const url = `${FDA_API}?search=${encodeURIComponent(query)}&limit=20`;

    const response = await fetch(url);

    if (response.status === 404) return [];

    if (!response.ok) {
        throw new Error(`FDA API returned status ${response.status}`);
    }

    const data = await response.json();
    return data.results || [];
}

medicineForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    const medicineName = medicineInput.value.trim();

    if (!medicineName) {
        statusMessage.textContent = "Please enter a medicine name.";
        resultsDiv.replaceChildren();
        return;
    }

    resultsDiv.replaceChildren();
    statusMessage.textContent = "Searching medicine information...";
    searchBtn.disabled = true;
    searchBtn.textContent = "Searching...";

    try {
        const searchNames = getSearchNames(medicineName);
        const fields = ["openfda.generic_name", "openfda.brand_name"];
        const allRecords = new Map();
        let successfulRequest = false;
        let lastError = null;

        for (const name of searchNames) {
            for (const field of fields) {
                try {
                    const records = await fetchRecords(field, name);
                    successfulRequest = true;

                    records.forEach(record => {
                        const key = record.id ||
                            JSON.stringify([
                                record.openfda,
                                record.indications_and_usage
                            ]);

                        if (!allRecords.has(key)) {
                            allRecords.set(key, record);
                        }
                    });
                } catch (error) {
                    lastError = error;
                    console.error("FDA search failed:", error);
                }
            }
        }

        const records = Array.from(allRecords.values());

        if (!successfulRequest) {
            throw lastError || new Error("FDA service unavailable.");
        }

        if (records.length === 0) {
            statusMessage.textContent =
                "No matching records found. Try another medicine name.";
            return;
        }

        const searchTerm = normalizeName(medicineName);

        records.sort((a, b) =>
            getMatchScore(b, searchTerm) -
            getMatchScore(a, searchTerm)
        );

        const topRecords = records.slice(0, 5);

        statusMessage.textContent =
            `Found ${records.length} records. Showing ${topRecords.length} results.`;

        topRecords.forEach((record, index) => {
            const openfda = record.openfda || {};
            const card = document.createElement("article");
            card.className = "medicine-card";

            const heading = document.createElement("h2");
            heading.textContent =
                (openfda.brand_name || [])[0] ||
                (openfda.generic_name || [])[0] ||
                medicineName;
            card.appendChild(heading);

            if (index === 0) {
                const badge = document.createElement("span");
                badge.className = "best-match-badge";
                badge.textContent = "Best Name Match";
                card.appendChild(badge);
            }

            const label = document.createElement("p");
            label.className = "record-label";
            label.textContent = `Result ${index + 1}`;
            card.appendChild(label);

            const explanationBox = document.createElement("div");
            explanationBox.className = "medicine-explanation";

            const explanationTitle = document.createElement("h3");
            explanationTitle.textContent = "What is this medicine used for?";

            const explanationText = document.createElement("p");
            explanationText.textContent =
                getSimpleExplanation(record, medicineName);

            explanationBox.append(explanationTitle, explanationText);
            card.appendChild(explanationBox);

            const details = document.createElement("div");
            details.className = "medicine-details";

            addDetail(details, "Generic name",
                (openfda.generic_name || []).join(", ") || "Not listed");
            addDetail(details, "Manufacturer",
                (openfda.manufacturer_name || []).join(", ") || "Not listed");
            addDetail(details, "Product type",
                (openfda.product_type || []).join(", ") || "Not listed");

            card.appendChild(details);

            const sections = [
                { title: "Uses", content:
                    record.indications_and_usage || record.purpose },
                { title: "Directions", content:
                    record.dosage_and_administration || record.directions },
                { title: "Side Effects", content:
                    record.adverse_reactions || record.side_effects },
                { title: "Warnings", content:
                    record.warnings || record.warnings_and_cautions }
            ];

            sections.forEach(section => {
                const box = document.createElement("section");
                box.className = "medicine-info-section";

                const h3 = document.createElement("h3");
                h3.textContent = section.title;
                box.appendChild(h3);

                const content = section.content;
                const paragraphs = Array.isArray(content)
                    ? content
                    : content ? [content] : [];

                if (!paragraphs.length) {
                    const p = document.createElement("p");
                    p.className = "unavailable";
                    p.textContent = "Information is not available in this record.";
                    box.appendChild(p);
                } else {
                    paragraphs.forEach(item => {
                        const p = document.createElement("p");
                        p.textContent = item;
                        box.appendChild(p);
                    });
                }

                card.appendChild(box);
            });

            const source = document.createElement("a");
            source.href = "https://open.fda.gov/apis/drug/label/";
            source.target = "_blank";
            source.rel = "noopener noreferrer";
            source.className = "source-link";
            source.textContent = "View FDA data source ↗";
            card.appendChild(source);

            resultsDiv.appendChild(card);
        });

        const disclaimer = document.createElement("div");
        disclaimer.className = "disclaimer";
        disclaimer.textContent =
            "Information is from the US FDA drug-label database. " +
            "A name match does not prove authenticity, batch validity, " +
            "or approval for sale in India. Consult a qualified healthcare " +
            "professional before using medicine.";

        resultsDiv.appendChild(disclaimer);

    } catch (error) {
        console.error("Medicine search error:", error);
        statusMessage.textContent =
            "Unable to load medicine information. Check your internet connection and try again.";
    } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = "Search Medicine";
    }
});
