import wixLocationFrontend from "wix-location-frontend";
import { createOpenAIResponse } from "backend/openAi"
import wixData from 'wix-data';
import wixWindowFrontend from "wix-window-frontend";
import { currentMember, authentication } from "wix-members-frontend";
import { orders } from "wix-pricing-plans-frontend";
import { generatePDF } from "backend/pdfGenerator";

// Global variables
let dbTemplate = "";
let dbInstruction = "";
let fileUrl = "";
let fileName = "";

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
    console.log('========================================');
    console.log('🚀 PAGE READY - Starting initialization');
    console.log('========================================');

   

    console.log('\n🔐 Checking authentication status...');
    // Collapse sections and error text on initial load
    // Check for member and active orders
    if (authentication.loggedIn()) {
        try {
            console.log('  → Fetching member details...');
            const member = await currentMember.getMember(options);
            MemberId = member._id;
            console.log("  ✅ Member ID:", MemberId);

            // Check orders for active membership
            console.log('\n📦 Checking membership status...');
            if (wixWindowFrontend.viewMode === 'Site') {
                console.log('  → Site mode: Checking orders...');
                const ordersList = await orders.listCurrentMemberOrders();
                console.log('  → Orders found:', ordersList.length);
                const hasActiveMembership = ordersList.some(order => order.status === "ACTIVE");

                if (!hasActiveMembership) {
                    console.log("  ❌ No active membership found. Redirecting to /pricing-plans...");
                    wixLocationFrontend.to("/pricing-plans");
                } else {
                    console.log("  ✅ Active membership confirmed.");
                }
            } else {
                console.log("  ⚠️ Preview mode: Skipping membership check.");
            }
        } catch (error) {
            console.error("  ❌ Error checking membership details:", error);
        }
    } else {
        console.log("  ❌ Member is not logged in. Redirecting to login...");
        authentication.promptLogin();
    }

    console.log('\n🎨 Setting up UI elements...');
    $w("#reportSection").collapse();
    $w("#errorText1").collapse(); // Collapse error text on load
    console.log('  ✅ Report section collapsed');
    console.log('  ✅ Error text collapsed');

    // --- Dropdown Population Logic ---
    console.log('\n📊 Loading dropdown data from database...');
    console.log('  → Query: AdminControl.distinct("productType")');
    await wixData.query("AdminControl").distinct("productType").then(results => {
        console.log('  ✅ Product Types loaded:', results.items.length, 'items');
        console.log('    Items:', results.items);
        if (results.items.length > 0) {
            $w("#dropdownProductType").options = results.items.map(item => ({ label: item, value: item }));
            console.log('  ✅ Product Type dropdown populated');
        } else {
            console.log('  ⚠️ No Product Types found in database');
        }
    }).catch(error => console.error("  ❌ Error loading Product Types:", error));

    console.log('  → Query: AdminControl.distinct("genre")');
    await wixData.query("AdminControl").distinct("genre").then(results => {
        console.log('  ✅ Genres loaded:', results.items.length, 'items');
        console.log('    Items:', results.items);
        if (results.items.length > 0) {
            $w("#dropdownGenre").options = results.items.map(item => ({ label: item, value: item }));
            console.log('  ✅ Genre dropdown populated');
        } else {
            console.log('  ⚠️ No Genres found in database');
        }
    }).catch(error => console.error("  ❌ Error loading Genres:", error));

    console.log('  → Query: AdminControl.distinct("tone")');
    await wixData.query("AdminControl").distinct("tone").then(results => {
        console.log('  ✅ Tones loaded:', results.items.length, 'items');
        console.log('    Items:', results.items);
        if (results.items.length > 0) {
            $w("#dropdownTone").options = results.items.map(item => ({ label: item, value: item }));
            console.log('  ✅ Tone dropdown populated');
        } else {
            console.log('  ⚠️ No Tones found in database');
        }
    }).catch(error => console.error("  ❌ Error loading Tones:", error));

    console.log('  → Query: AdminControl.distinct("targetAudience")');
    await wixData.query("AdminControl").distinct("targetAudience").then(results => {
        console.log('  ✅ Target Audiences loaded:', results.items.length, 'items');
        console.log('    Items:', results.items);
        if (results.items.length > 0) {
            $w("#dropdownTargetAudience").options = results.items.map(item => ({ label: item, value: item }));
            console.log('  ✅ Target Audience dropdown populated');
        } else {
            console.log('  ⚠️ No Target Audiences found in database');
        }
    }).catch(error => console.error("  ❌ Error loading Target Audiences:", error));
    console.log('  → Query: AdminControl.distinct("purposeGoal")');
    await wixData.query("AdminControl").distinct("purposeGoal").then(results => {
        console.log('  ✅ Purpose/Goals loaded:', results.items.length, 'items');
        console.log('    Items:', results.items);
        if (results.items.length > 0) {
            $w("#purpose").options = results.items.map(item => ({ label: item, value: item }));
            console.log('  ✅ Purpose dropdown populated');
        } else {
            console.log('  ⚠️ No Purpose/Goals found in database');
        }
    }).catch(error => console.error("  ❌ Error loading Purpose/Goals:", error));
    console.log('  → Query: AdminControl.distinct("wordCount")');
    await wixData.query("AdminControl").distinct("wordCount").then(results => {
        console.log('  ✅ Word Counts loaded:', results.items.length, 'items');
        console.log('    Items:', results.items);
        if (results.items.length > 0) {
            // Filter out "Very Long" for Beta phase
            const filteredOptions = results.items
                .filter(item => !item.includes("Very Long"))
                .map(item => ({ label: item, value: item }));
            console.log('    Filtered to:', filteredOptions.length, 'items (removed "Very Long")');
            $w("#wordCount").options = filteredOptions;
            console.log('  ✅ Word Count dropdown populated');
        } else {
            console.log('  ⚠️ No Word Counts found in database');
        }

    }).catch(error => console.error("  ❌ Error loading Word Counts:", error));
    console.log('\n📚 Loading database instructions and templates...');
    console.log('  → Query: AdminControl.find()');
    let query = wixData.query("AdminControl");
    let results1 = await query.find();
    console.log('  ✅ Query completed. Total items found:', results1.items.length);

    const correctItem = results1.items.find(item =>
        item.promptTemplateName && item.instruction
    );

    // Check if an item meeting the criteria was found
    if (correctItem) {
        // If found, safely assign the values from that item
        dbTemplate = correctItem.promptTemplateName;
        dbInstruction = correctItem.instruction;

        console.log('  ✅ Template and Instruction loaded successfully!');
        console.log('    → Template preview:', dbTemplate.substring(0, 100) + '...');
        console.log('    → Template length:', dbTemplate.length, 'characters');
        console.log('    → Instruction preview:', dbInstruction.substring(0, 100) + '...');
        console.log('    → Instruction length:', dbInstruction.length, 'characters');

    } else {
        // If no item meets the criteria (or array is empty)
        dbTemplate = "";
        dbInstruction = "";

        console.log('  ⚠️ No suitable item (with both template and instruction) was found.');
        console.log('    → dbTemplate is EMPTY');
        console.log('    → dbInstruction is EMPTY');
    }

    // Set up click handler
    console.log('\n🔧 Setting up event handlers...');
    $w("#generate").onClick(onGenerateButtonClick);
    console.log('  ✅ Generate button click handler attached');

    console.log('\n========================================');
    console.log('✅ INITIALIZATION COMPLETE');
    console.log('========================================');
    console.log('Summary:');
    console.log('  - Elements: Ready');
    console.log('  - Dropdowns: Populated');
    console.log('  - DB Template:', dbTemplate ? 'Loaded (' + dbTemplate.length + ' chars)' : 'EMPTY');
    console.log('  - DB Instruction:', dbInstruction ? 'Loaded (' + dbInstruction.length + ' chars)' : 'EMPTY');
    console.log('  - Event handlers: Attached');
    console.log('========================================\n');
});

/**
 * Handles the click event of the Generate button.
 */
async function onGenerateButtonClick() {
    // 1. Get selected values from dropdowns and user input
    const productType = $w("#dropdownProductType").value;
    const genre = $w("#dropdownGenre").value;
    const tone = $w("#dropdownTone").value;
    const targetAudience = $w("#dropdownTargetAudience").value;
    const purposeGoal = $w("#purpose").value;
    const wordCount = $w("#wordCount").value;

    // Parse keywords from text area: split by comma or whitespace, ignore empty, join with comma
    const rawKeywords = $w("#keywordsTextArea").value || "";
    const keywords = rawKeywords.split(/[\s,]+/).filter(k => k).join(", ");

    // Capture notes from the dedicated text area
    const notes = $w("#notesTextArea").value || "";

    // Collapse any previous error/status message
    $w("#errorText1").collapse();

    // Basic validation
    if (!productType || !genre || !tone || !targetAudience || !purposeGoal || !wordCount) {
        console.log("Please select a value for all dropdowns.");
        $w("#errorText1").text = "🛑 Please select a value for all dropdowns.";
        $w("#errorText1").expand();
        return;
    }

    // --- Show Status: "Generating Report" ---
    $w("#errorText1").text = "🤖 Generating report... Please wait.";
    $w("#errorText1").expand();
    $w("#generate").disable(); // Disable button while processing

    // BETA RESTRICTION: Check for Book
    if (productType === "Book") {
        $w("#errorText1").text = "🚧 'Full Book' is held for Post-Beta. Please select another product type.";
        $w("#generate").enable();
        return;
    }

    // 2. Query the AdminControl collection for the instruction
    try {

        // 3. Construct the product-specific rules part of the prompt
        const rules = PRODUCT_RULES[productType];
        let rulesPrompt = "";

        if (rules) {
            rulesPrompt = `
### ${productType.toUpperCase()} STRUCTURE:
- MUST INCLUDE: ${rules.mustInclude.join(", ")}
- MUST NOT BE: ${rules.mustNotBe.join(", ")}
- ASSUMPTION: ${rules.defaultAssumption}
            `;
        }

        // 4. Construct the slimmed final prompt
        const finalPrompt = `
### INSTRUCTIONS:
${dbInstruction}

${rulesPrompt}

### CRITERIA:
${UNIVERSAL_CHECKLIST.map(item => `- ${item}`).join("\n")}

### PARAMETERS:
- Product: ${productType}
- Topic: ${genre}
- Tone: ${tone}
- Audience: ${targetAudience}
- Goal: ${purposeGoal}
- Words: ${wordCount}
- Keywords: ${keywords}
- Notes: ${notes}

### OUTPUT REQUIREMENTS:
1. START IMMEDIATELY with the title. No intro fluff.
2. MATCH the Word Count depth: ${wordCount}.
3. PROOFREAD for perfect grammar.

[TEMPLATE]
${dbTemplate}
`;

        // 5. Call OpenAI
        await sendToOpenAI(finalPrompt);

    } catch (error) {
        console.error("Error during generation process:", error);
        $w("#errorText1").text = "⚠️ An error occurred while fetching instructions from the database.";
        $w("#errorText1").expand(); // Keep error visible
        $w("#generate").enable(); // Re-enable button
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
        $w("#errorText1").collapse();

    } catch (error) {
        console.error("Failed to get response from OpenAI:", error);
        $w("#errorText1").text = "❌ Failed to generate report. Please check the backend service.";
        $w("#errorText1").expand(); // Show error
    } finally {
        $w("#generate").enable(); // Re-enable button regardless of success/fail
    }
}

$w('#generateAgain').onClick((event) => {
    $w("#reportSection").collapse();
    $w("#formSection").expand();
    $w("#reportOutput").text = " ";

    // --- Action 2: Collapse error text when trying again ---
    $w("#errorText1").collapse();
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
        report: report,
        fileUrl: fileUrl,
        fileName: fileName,
        generatedDate: new Date()
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
});

$w('#downloadProduct').onClick(async (event) => {
    console.log('=== DOWNLOAD BUTTON CLICKED ===');

    // Basic validation
    if (!report) {
        console.log('ERROR: No report available');
        $w('#errorText2').text = "⚠️ No report available to download. Generate one first.";
        $w('#errorText2').expand();
        return;
    }

    console.log('Report available, length:', report.length);
    $w('#errorText2').text = "⏳ Generating PDF... Please wait.";
    $w('#errorText2').expand();

    try {
        console.log('Calling generatePDF...');
        console.log('Report:', report);
        // 1. Generate the PDF
        const response = await generatePDF(report);

        console.log('=== FULL RESPONSE ===');
        console.log('Response object:', response);
        console.log('Response.success:', response.success);
        console.log('Response.downloadUrl:', response.downloadUrl);
        console.log('Response.fileUrl:', response.fileUrl);
        console.log('Response.fileName:', response.fileName);
        console.log('Response.error:', response.error);
        console.log('=== END RESPONSE ===');

        if (!response.success) {
            console.error('Backend returned success=false');
            throw new Error(response.error || 'Backend generation failed');
        }

        // 2. Prepare database entry
        fileUrl = response.fileUrl;
        fileName = response.fileName;
        console.log('Stored fileUrl:', fileUrl);
        console.log('Stored fileName:', fileName);

        // 3. Determine download URL (fallback to fileUrl if missing)
        const dlUrl = response.downloadUrl || response.fileUrl;
        console.log('Determined download URL:', dlUrl);

        if (!dlUrl) {
            console.error('No download URL available!');
            throw new Error('No download URL returned from backend');
        }

        // 4. Update UI and Trigger Download
        console.log('Triggering download to:', dlUrl);
        $w('#errorText2').text = "✅ PDF Generated! Downloading...";
        wixLocationFrontend.to(dlUrl);
        console.log('Download triggered successfully');

    } catch (error) {
        console.error('=== DOWNLOAD ERROR ===');
        console.error('Error object:', error);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('=== END ERROR ===');
        $w('#errorText2').text = "❌ PDF Generation failed: " + (error.message || "Try again.");
        $w('#errorText2').expand();
    }
});