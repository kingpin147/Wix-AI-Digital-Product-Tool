import wixLocationFrontend from "wix-location-frontend";
import { createOpenAIResponse } from "backend/openAi"
import wixData from 'wix-data';
import wixWindowFrontend from "wix-window-frontend";
import { currentMember, authentication } from "wix-members-frontend";
import { orders } from "wix-pricing-plans-frontend";

// IMPORTANT: Replace the placeholder IDs below with the actual IDs of your elements.
const DROPDOWN_PRODUCT_TYPE_ID = "#dropdownProductType";
const DROPDOWN_GENRE_ID = "#dropdownGenre";
const DROPDOWN_TONE_ID = "#dropdownTone";
const DROPDOWN_TARGET_AUDIENCE_ID = "#dropdownTargetAudience";
const GENERATE_BUTTON_ID = "#generate"; // Assuming the button ID is #generate
const ERROR_TEXT_ID = "#errorText1"; // ID for the status/error text element
let dbTemplate = "";
let dbInstruction = "";

// Product-Ready Rules based on requirements
const PRODUCT_RULES = {
    "Lead Magnet": {
        mustInclude: ["Clear Title", "Brief Welcome/Introduction", "Actionable Framework (checklist, steps, tips, or short guide)", "Reflection or Action Section", "Clear Call-to-Action (CTA)"],
        mustNotBe: ["Blog post", "Generic informational article", "Academic explanation"],
        defaultAssumption: "1-3 pages, high-value downloadable resource.",
        structuralRequirement: "Use bullet points and bold headers for scanability."
    },
    "Lesson Plan": {
        mustInclude: ["Lesson Title", "Target Audience/Level", "Learning Objectives", "Materials Needed", "Step-by-Step Instruction Guide", "Activities & Exercises", "Assessment/Outcomes"],
        mustNotBe: ["Devotional", "Motivational article", "General advice list"],
        defaultAssumption: "Instructor-ready teaching guide for immediate classroom use.",
        structuralRequirement: "Formal educational structure with timed sections if possible."
    },
    "Workbook / Worksheet": {
        mustInclude: ["Engaging Title", "Guided Instructions", "Self-Reflection Questions", "Fill-in-the-blank or Exercise Sections", "Actionable Exercises"],
        mustNotBe: ["Essay-style content", "Narrative-only material"],
        defaultAssumption: "Interactive digital product designed for user participation.",
        structuralRequirement: "Consistent use of 'Your Turn' or 'Reflect Here' boxes."
    },
    "Course Outline": {
        mustInclude: ["Course Title", "High-level Course Summary", "Module Breakdown", "Individual Lesson Titles per Module", "Specific Learning Outcomes per Lesson", "Recommended Resources"],
        mustNotBe: ["Full transcripts", "Short summary"],
        defaultAssumption: "Comprehensive structural map for a multi-week training program.",
        structuralRequirement: "Logical progression from beginner to advanced concepts."
    },
    "Book": {
        mustInclude: ["COMING SOON"],
        mustNotBe: ["Any output"],
        defaultAssumption: "Hold for Post-Beta.",
        structuralRequirement: "NOT AVAILABLE IN BETA."
    }
};

const UNIVERSAL_CHECKLIST = [
    "Match the selected Product Type exactly",
    "Product-Ready: Be usable as-is (PDF, document, or digital download)",
    "Professional Formatting: Use Markdown (headings, bolding, lists)",
    "High Quality: Zero spelling or grammatical errors",
    "Actionable: Focus on transformation and results, not just info",
    "No Meta-Talk: Do not include 'Here is your product' or conversational filler",
    "Word Count Adherence: Meet or exceed the targeted word count with meaningful content"
];

let options = {
    fieldsets: ['FULL']
}
let MemberId = null;
let report = null;

$w.onReady(async function () {
    // Collapse sections and error text on initial load
    // Check for member and active orders
    if (authentication.loggedIn()) {
        try {
            const member = await currentMember.getMember(options);
            MemberId = member._id;
            console.log("Member ID:", MemberId);

            // Check orders for active membership
            if (wixWindowFrontend.viewMode === 'Site') {
                const ordersList = await orders.listCurrentMemberOrders();
                const hasActiveMembership = ordersList.some(order => order.status === "ACTIVE");

                if (!hasActiveMembership) {
                    console.log("No active membership found. Redirecting to /pricing-plans...");
                    wixLocationFrontend.to("/pricing-plans");
                } else {
                    console.log("Active membership confirmed.");
                }
            } else {
                console.log("Preview mode: Skipping membership check.");
            }
        } catch (error) {
            console.error("Error checking membership details:", error);
        }
    } else {
        console.log("Member is not logged in. Redirecting to login...");
        authentication.promptLogin();
    }

    $w("#reportSection").collapse();
    $w(ERROR_TEXT_ID).collapse(); // Collapse error text on load

    // --- Dropdown Population Logic (omitted for brevity, assume it's correct) ---
    // ... (Your dropdown population code) ...
    await wixData.query("AdminControl").distinct("productType").then(results => {
        if (results.items.length > 0) $w(DROPDOWN_PRODUCT_TYPE_ID).options = results.items.map(item => ({ label: item, value: item }));
    }).catch(error => console.error("Error loading Product Types:", error));

    await wixData.query("AdminControl").distinct("genre").then(results => {
        if (results.items.length > 0) $w(DROPDOWN_GENRE_ID).options = results.items.map(item => ({ label: item, value: item }));
    }).catch(error => console.error("Error loading Genres:", error));

    await wixData.query("AdminControl").distinct("tone").then(results => {
        if (results.items.length > 0) $w(DROPDOWN_TONE_ID).options = results.items.map(item => ({ label: item, value: item }));
    }).catch(error => console.error("Error loading Tones:", error));

    await wixData.query("AdminControl").distinct("targetAudience").then(results => {
        if (results.items.length > 0) $w(DROPDOWN_TARGET_AUDIENCE_ID).options = results.items.map(item => ({ label: item, value: item }));
    }).catch(error => console.error("Error loading Target Audiences:", error));
    await wixData.query("AdminControl").distinct("purposeGoal").then(results => {
        if (results.items.length > 0) $w("#purpose").options = results.items.map(item => ({ label: item, value: item }));
    }).catch(error => console.error("Error loading Target Audiences:", error));
    await wixData.query("AdminControl").distinct("wordCount").then(results => {
        if (results.items.length > 0) {
            // Filter out "Very Long" for Beta phase
            const filteredOptions = results.items
                .filter(item => !item.includes("Very Long"))
                .map(item => ({ label: item, value: item }));
            $w("#wordCount").options = filteredOptions;
        }
    }).catch(error => console.error("Error loading Word Counts:", error));
    // --- End of dropdown population logic ---

    // Set up click handler
    $w(GENERATE_BUTTON_ID).onClick(onGenerateButtonClick);
});

/**
 * Handles the click event of the Generate button.
 */
async function onGenerateButtonClick() {
    // 1. Get selected values from dropdowns and user input
    const productType = $w(DROPDOWN_PRODUCT_TYPE_ID).value;
    const genre = $w(DROPDOWN_GENRE_ID).value;
    const tone = $w(DROPDOWN_TONE_ID).value;
    const targetAudience = $w(DROPDOWN_TARGET_AUDIENCE_ID).value;
    const purposeGoal = $w("#purpose").value;
    const wordCount = $w("#wordCount").value;

    // Parse keywords from text area: split by comma or whitespace, ignore empty, join with comma
    const rawKeywords = $w("#keywordsTextArea").value || "";
    const keywords = rawKeywords.split(/[\s,]+/).filter(k => k).join(", ");

    // Capture notes from the dedicated text area
    const notes = $w("#notesTextArea").value || "";

    // Collapse any previous error/status message
    $w(ERROR_TEXT_ID).collapse();

    // Basic validation
    if (!productType || !genre || !tone || !targetAudience || !purposeGoal || !wordCount) {
        console.log("Please select a value for all dropdowns.");
        $w(ERROR_TEXT_ID).text = "🛑 Please select a value for all dropdowns.";
        $w(ERROR_TEXT_ID).expand();
        return;
    }

    // --- Show Status: "Generating Report" ---
    $w(ERROR_TEXT_ID).text = "🤖 Generating report... Please wait.";
    $w(ERROR_TEXT_ID).expand();
    $w(GENERATE_BUTTON_ID).disable(); // Disable button while processing

    // BETA RESTRICTION: Check for Book
    if (productType === "Book") {
        $w(ERROR_TEXT_ID).text = "🚧 'Full Book' is held for Post-Beta. Please select another product type.";
        $w(GENERATE_BUTTON_ID).enable();
        return;
    }

    // 2. Query the AdminControl collection for the instruction
    try {
        let query = wixData.query("AdminControl");
        let results = await query.find();

        const correctItem = results.items.find(item =>
            item.promptTemplateName && item.instruction
        );

        // Check if an item meeting the criteria was found
        if (correctItem) {
            // If found, safely assign the values from that item
            dbTemplate = correctItem.promptTemplateName;
            dbInstruction = correctItem.instruction;

            console.log(`Template found at random index: ${dbTemplate}`);
            console.log(`Instruction found at random index: ${dbInstruction}`);

        } else {
            // If no item meets the criteria (or array is empty)
            dbTemplate = "";
            dbInstruction = "";

            console.log("No suitable item (with both template and instruction) was found.");
        }

        // 3. Construct the product-specific rules part of the prompt
        const rules = PRODUCT_RULES[productType];
        let rulesPrompt = "";

        if (rules) {
            rulesPrompt = `
### PRODUCT-READY RULES FOR ${productType.toUpperCase()}:
- MUST INCLUDE: ${rules.mustInclude.join(", ")}
- MUST NOT BE: ${rules.mustNotBe.join(", ")}
- DEFAULT ASSUMPTION: ${rules.defaultAssumption}

### UNIVERSAL PRODUCT-READY CHECKLIST:
${UNIVERSAL_CHECKLIST.map(item => `- ${item}`).join("\n")}
            `;
        }

        // 4. Construct the final prompt with a high-priority "System Instruction" block
        const finalPrompt = `
### SYSTEM ROLE:
You are an expert ${productType} creator and professional editor. Your goal is to produce a "READY-TO-SELL" digital product.

### FINAL PRODUCT CRITERIA:
${UNIVERSAL_CHECKLIST.map(item => `- ${item}`).join("\n")}

### INSTRUCTIONS:
${dbInstruction}

${rulesPrompt}

### USER-SELECTED PARAMETERS:
- Product Type: ${productType}
- Genre/Topic: ${genre}
- Tone: ${tone}
- Target Audience: ${targetAudience}
- Purpose/Goal: ${purposeGoal}
- Targeted Word Count: ${wordCount}
- Mandatory Keywords: ${keywords}
- Additional Notes: ${notes}

### FINAL OUTPUT REQUIREMENTS:
1. START IMMEDIATELY with the product title.
2. DO NOT include any introductory or concluding remarks (e.g., "I hope this helps").
3. ENSURE the depth of content matches the Word Count: ${wordCount}. If 'Long' or 'Very Long' (if applicable) is selected, provide exhaustive detail.
4. If the product is a BOOK, it MUST have a chapter-by-chapter structure with at least 5-10 chapters unless otherwise specified.
5. CHECK all spelling and grammar before outputting.

[PROMPT TEMPLATE START]
${dbTemplate}
[PROMPT TEMPLATE END]
`;

        // 5. Call OpenAI
        await sendToOpenAI(finalPrompt);

    } catch (error) {
        console.error("Error during generation process:", error);
        $w(ERROR_TEXT_ID).text = "⚠️ An error occurred while fetching instructions from the database.";
        $w(ERROR_TEXT_ID).expand(); // Keep error visible
        $w(GENERATE_BUTTON_ID).enable(); // Re-enable button
    }
}

/**
 * Sends the final prompt to the OpenAI backend function and handles UI updates.
 * @param {string} prompt The combined instruction and user request.
 */
async function sendToOpenAI(prompt) {
    try {
        // 5. Call the backend function
        const aiResponse = await createOpenAIResponse(prompt);
        report = await aiResponse;
        $w("#reportOutput").text = aiResponse;
        $w("#reportSection").expand();
        $w("#formSection").collapse();

        // --- Action 1: Collapse status text after success ---
        $w(ERROR_TEXT_ID).collapse();

    } catch (error) {
        console.error("Failed to get response from OpenAI:", error);
        $w(ERROR_TEXT_ID).text = "❌ Failed to generate report. Please check the backend service.";
        $w(ERROR_TEXT_ID).expand(); // Show error
    } finally {
        $w(GENERATE_BUTTON_ID).enable(); // Re-enable button regardless of success/fail
    }
}

$w('#generateAgain').onClick((event) => {
    $w("#reportSection").collapse();
    $w("#formSection").expand();
    $w("#reportOutput").text = " ";

    // --- Action 2: Collapse error text when trying again ---
    $w(ERROR_TEXT_ID).collapse();
    $w('#errorText2').collapse();
})

$w('#copy').onClick(async (event) => {
    // Collapse any old error text before trying to copy
    $w('#errorText2').collapse();

    const ReportText = $w('#reportOutput').text;
    await wixWindowFrontend
        .copyToClipboard(ReportText)
        .then(() => {
            $w('#errorText2').text = "✅ Report Successfully Copied";
            $w('#errorText2').expand();
        })
        .catch((err) => {
            $w('#errorText2').text = "❌ Report copy failed... try again";
            $w('#errorText2').expand();
        });
})

$w('#saveReport').onClick(async (event) => {
    let toInsert = {
        memberId: MemberId,
        report: report
    }
    await wixData
        .insert("SavedReports", toInsert)
        .then((item) => {
            console.log(item); //see item below
            $w('#errorText2').text = "✅ Report Successfully Saved";
            $w('#errorText2').expand();
        })
        .catch((err) => {
            console.log(err);
            $w('#errorText2').text = "❌ Report save failed... try again";
            $w('#errorText2').expand();
        });

})