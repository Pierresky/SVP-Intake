// GPLANS Vendor Script
window.initVendor = function(processInitialBtn, processRefillBtn, intakeDataTextarea, refillDataTextarea, resultDiv) {
    console.log("GPLANS vendor script loaded");
    
    // Set up copy to clipboard function specifically for GPLANS
    window.copyToClipboard = function(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            const htmlContent = element.innerHTML;
            
            // Create a temporary element to store the HTML
            const tempElement = document.createElement('div');
            tempElement.innerHTML = htmlContent;
            
            // Use clipboard API to copy as HTML
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const clipboardItem = new ClipboardItem({ 'text/html': blob });
            
            navigator.clipboard.write([clipboardItem]).then(() => {
                alert('Copied Successfully!');
            }).catch(err => {
                console.error('Failed to copy: ', err);
            });
        }
    };
    
    // Initial visit processing
    processInitialBtn.addEventListener('click', function() {
        const intakeData = intakeDataTextarea.value;

        if (intakeData.trim() === '') {
            alert('Please enter intake data');
            return;
        }

        // Extract preferred medication
        let preferredMeds = 'X';
        const medMatch = intakeData.match(/Medication the patient wants\?\n([A-Z ]+ [a-z]+ [a-z]+) \(.*\)/);
        
        if (medMatch) {
            preferredMeds = medMatch[1]
                .replace(/ compound| generic| brand/g, '') // Remove unwanted descriptors
                .trim();
        }

        // Extract weight, BMI, and goal weight
        const weightMatch = intakeData.match(/Weight \(lbs\.\)\n(\d+)/);
        const bmiMatch = intakeData.match(/BMI\n(\d+\.\d+)/);
        const goalWeightMatch = intakeData.match(/Goal weight\.\n(\d+)/);

        const weight = weightMatch ? weightMatch[1] : 'X';
        const bmi = bmiMatch ? bmiMatch[1] : 'X';
        const goalWeight = goalWeightMatch ? goalWeightMatch[1] : 'X';

        // Apply highlight only if there’s a value
        const highlightedMeds = preferredMeds === 'X' ? 'X' : `<span style="background-color:#FFFF00">${preferredMeds}</span>`;
        const highlightedWeight = weight === 'X' ? 'X' : `<span style="background-color:#FFFF00">${weight}</span>`;
        const highlightedBMI = bmi === 'X' ? 'X' : `<span style="background-color:#FFFF00">${bmi}</span>`;
        const highlightedGoalWeight = goalWeight === 'X' ? 'X' : `<span style="background-color:#FFFF00">${goalWeight}</span>`;

         // Extract weight loss medication history
         const currentlyTakingMatch = intakeData.match(/Are you currently taking medication\(s\) for weight loss\?\n(Yes|No)/);
         const currentMedsMatch = intakeData.match(/Please list the name, dose, and frequency of. your current weight loss medication\(s\).\n(.+)/);
         const pastMedsMatch = intakeData.match(/Have you taken any prescription medications to lose weight before\?\n(.+)/);
 
         const currentlyTaking = currentlyTakingMatch ? currentlyTakingMatch[1] : 'No';
         const currentMeds = currentMedsMatch ? currentMedsMatch[1].trim() : '';
         const pastMeds = pastMedsMatch ? pastMedsMatch[1].trim() : '';
 
         let weightLossHistory = '';
 
         if (currentlyTaking === 'Yes' && pastMeds.toLowerCase() !== 'no') {
             weightLossHistory = `The patient has tried <span style="background-color:#FFFF00">${pastMeds}</span> before and is currently taking <span style="background-color:#FFFF00">${currentMeds}</span> for weight loss.`;
         } else if (currentlyTaking === 'Yes') {
             weightLossHistory = `The patient is currently taking <span style="background-color:#FFFF00">${currentMeds}</span> medications for weight loss.`;
         } else if (pastMeds.toLowerCase() !== 'no') {
             weightLossHistory = `The patient has tried <span style="background-color:#FFFF00">${pastMeds}</span> medications in the past for weight loss.`;
         } else {
             weightLossHistory = `The patient <span style="background-color:#FFFF00">denied</span> medication in the past for weight loss.`;
         }

        // Extract blood pressure
        let bloodPressure = 'X';
        const bpMatch = intakeData.match(/What is your current or average blood pressure range\?\n(.+)/);
        if (bpMatch) {
            bloodPressure = bpMatch[1].trim();
        }

        // Extract resting heart rate
        let heartRate = 'X';
        const hrMatch = intakeData.match(/What is your current or average resting heart rate range\?\n(.+)/);
        if (hrMatch) {
            heartRate = hrMatch[1].trim();
        }


        // Extract surgical history properly
        let surgicalHistory = "Denies any surgical history including bariatric surgery.";
        const surgeryMatch = /Have you had bariatric \(weight loss\) surgery before\?\n([^\n]+)/.exec(intakeData);

        if (surgeryMatch) {
            let surgeryResponse = surgeryMatch[1].trim();
            if (surgeryResponse.toLowerCase() === "yes") {
                surgicalHistory = `<span style="background-color:#FFFF00">History of: Bariatric surgery</span>.`;
            } else if (surgeryResponse.toLowerCase() !== "no") {
                surgicalHistory = `<span style="background-color:#FFFF00">History of: ${surgeryResponse}</span>.`;
            }
        }

        const conditions = /Do any of the following currently or recently apply to you\?\n([\s\S]*?)(?:\nHave you been diagnosed|$)/.exec(intakeData);

        const bariatricSurgery = /Have you had bariatric \(weight loss\) surgery before\?\n(.*?)(?:\n|$)/.exec(intakeData);

        const diabetes = /Have you been diagnosed with prediabetes or type 2 diabetes\?\n(.*?)(?:\n|$)/.exec(intakeData);

        const medicationDetails = /If yes, please include name, dose, and frequency of all your medications[\s\S]*?\n([\s\S]*?)(?:\n\n|\n[A-Z]|$)/.exec(intakeData);

        // Extract additional medical conditions
        let otherConditions = [];
        const additionalConditions = /Please list any other medical conditions not mentioned above\.\n([\s\S]*?)(?=\n(?:Are|Is|Have|What|Please|If|How|Would|Did|When|Where|Why|The|Any)|\n\n|$)/s.exec(intakeData);

        if (additionalConditions && additionalConditions[1] && additionalConditions[1].trim() !== "" &&
            !additionalConditions[1].trim().toLowerCase().includes("none") &&
            !additionalConditions[1].trim().toLowerCase().includes("n/a")) {
            otherConditions = additionalConditions[1].trim().split(/[,;.\n]/).map(c => c.trim()).filter(c => c !== "");
        }

        // Define mapping for condition normalization
        const conditionMap = {
            "Hypertension (high blood pressure)": "High Blood Pressure",
            "Hypertension": "High Blood Pressure",
            "High blood pressure": "High Blood Pressure",
            "Liver disease, including nonalcoholic fatty liver disease (NAFLD)": "Liver Disease",
            "High cholesterol or triglycerides": "High Cholesterol",
            "High cholesterol": "High Cholesterol",
            "Asthma/reactive airway disease": "Asthma"
        };

        // Handling conditions
        const allConditions = [
            "Medullary thyroid cancer", "Multiple endocrine neoplasia type 2", "Abnormal heart rhythm", "Anorexia",
            "Asthma", "Anxiety", "Bulimia", "Cancer", "Crohn's Disease", "Depression", "Glaucoma", "Heart Attack",
            "High Blood Pressure", "High Cholesterol", "Hyperthyroidism", "Irritable Bowel Syndrome", "Kidney Disease",
            "Liver Disease", "Pancreatitis", "Seizures", "Stroke", "Ulcerative colitis", "bowel obstruction or impaction"
        ];

        let deniedConditions = [...allConditions];
        let historyOf = [];

        if (conditions) {
            const reportedConditions = conditions[1].split('\n').map(c => c.trim()).filter(c => c !== 'None of the above');

            reportedConditions.forEach(condition => {
                // Normalize the condition using the mapping
                const normalizedCondition = conditionMap[condition] || condition;

                // Remove from denied list and add to history
                const indexInDenied = deniedConditions.findIndex(c =>
                    c.toLowerCase() === normalizedCondition.toLowerCase());

                if (indexInDenied !== -1) {
                    deniedConditions.splice(indexInDenied, 1);
                    historyOf.push(normalizedCondition);
                } else if (condition && condition.trim() !== "" &&
                        condition.toLowerCase() !== "none of the above") {
                    // Add any condition not in our predefined list
                    historyOf.push(normalizedCondition);
                }
            });
        }

        // Add other conditions to history
        if (otherConditions.length > 0) {
            historyOf = [...historyOf, ...otherConditions];
        }

        // Handling diabetes
        if (diabetes && diabetes[1].toLowerCase() === 'yes') {
            historyOf.push("prediabetes or type 2 diabetes");
        }

        // Extract shipping address
        let shippingAddress = 'X';
        let hasPOBox = false;
        const addressMatch = intakeData.match(/Please list shipping address \(No PO boxes\)\n(.+)/);
        
        if (addressMatch) {
            shippingAddress = addressMatch[1].trim();
            
            // Check for PO Box in different formats (case insensitive)
            const poBoxRegex = /p\.?\s*o\.?\s*box|po\s*box|p\s*o\s*box/i;
            hasPOBox = poBoxRegex.test(shippingAddress);
        }

        // Format the result
        const GPresult = `
            <h1>GPlans/FuturHealth Initial Visit Processing</h1>
            <h3><strong><span style="background-color:#FFFF00">Initial Visit</span></strong></h3>
                <ul>
                    <li>The patient would like to start on ${highlightedMeds} medication.</li>
                    <li>${weightLossHistory}</li>
                    <li>Starting weight: ${highlightedWeight}</li>
                    <li>Starting BMI: ${highlightedBMI}</li>
                    <li>Goal weight: ${highlightedGoalWeight}</li>
                    <li>Last labs completed:</li>
                    <li>Local pharmacy:</li>
                </ul>                
            <h3><strong>Refill Visit</strong></h3>
                <ul>
                    <li>The patient is currently on X mg of Y for the last Z weeks.</li>
                    <li>Date of last injection:</li>
                    <li>How many injections has the patient taken on the current dose:</li>
                </ul>

            <h1>GPlans/FuturHealth Initial Visit Ai version</h1>
            <div id="initialVisitAiSection">
             <h3><strong><span style="background-color:#FFFF00">Initial Visit</span></strong></h3>          
                <ul>
                    <li>The patient would like to start on: ${highlightedMeds}.</li>
                    <li>${weightLossHistory}</li>
                    <li>The patient has tried the following medications in the past for weight loss: <span style="background-color:#FFFF00">None.</span></li>
                    <li>Starting weight: ${highlightedWeight}</li>
                    <li>Starting BMI: ${highlightedBMI}.</li>
                    <li>Goal weight: ${highlightedGoalWeight}</li>
                    <li>Last labs completed:</li>
                    <li>Local pharmacy:</li>
                </ul>
            </div>    
            <button onclick="copyToClipboard('initialVisitAiSection')">Copy</button>


            <h1><strong>Vitals</strong></h1>
            <p>Current or average blood pressure range: <span style="background-color:#FFFF00">${bloodPressure}</span></p>
            <p>Current or average resting heart rate range: <span style="background-color:#FFFF00">${heartRate}</span></p>


            <h3><strong>Medical History</strong></h3>
            <p><strong>Past Medical History</strong><br>
            Denies PMHX: ${deniedConditions.join(', ')}.
            ${historyOf.length > 0 ? `<br><span style="background-color:#FFFF00">History of: ${[...new Set(historyOf)].join(', ')}</span>.` : ''}
            </p>

            <p><strong>Surgical History</strong><br>${surgicalHistory}</p>

            <p><strong>Family History</strong><br>
            ${conditions && conditions[1]?.includes("Personal or family history of thyroid cyst/nodule, thyroid cancer, medullary thyroid carcinoma, or multiple endocrine neoplasia syndrome type 2") ? 
                `<span style="background-color:#FFFF00">History of: Personal or family history of thyroid cyst/nodule, thyroid cancer, medullary thyroid carcinoma, or multiple endocrine neoplasia syndrome type 2</span>.` :
                `Denies family history of: Medullary thyroid cancer, multiple endocrine neoplasia type 2.`}
            </p>


            <p><strong>Social History</strong><br>
            ${conditions && conditions[1]?.includes("Drug or alcohol misuse") ? 
                `<span style="background-color:#FFFF00">History of: drug and alcohol misuse</span>` :
                `Denies drug and alcohol misuse`}
            </p>

             <h3><strong>Shipping Address</strong></h3>
            <p>
            ${hasPOBox ? 
                `<span style="background-color:#FFFF00">${shippingAddress}</span><br><span style="background-color:#FFFF00">Providers Note: Need to confirm patient's address as our pharmacies do not ship Rx's to PO Box.</span>` :
                `<span style="background-color:#FFFF00">${shippingAddress}</span>`}
            </p>

            <h3>Preferred Medication</h3>
            <p>
            ${highlightedMeds}
            </p>
            
        </div>

                    `;
              
       resultDiv.innerHTML = GPresult;
    });
    // --------------------------------------------------------------REFILL AREA--------------------------------------------------------------//
    
    
    // Refill visit processing
    const medications = [
        "INJECTABLE semaglutide compound ( semaglutide sku_1 )",
        "INJECTABLE tirzepatide compound ( tirzepatide sku_2 )",
        "INJECTABLE Ozempic brand ( ozempic sku_3 )",
        "INJECTABLE Zepbound brand ( zepbound sku_4 )",
        "ORAL semaglutide compound( semaglutide sku_5 )",
        "ORAL metformin generic ( metformin sku_6 )",
        "ORAL tirzepatide compound ( compound_order ) ( tirzepatide sku_7 )"
    ];

    function extractMedication(refillData) {
        refillData = refillData.toLowerCase().replace(/\s+/g, ' ');
        
        for (let med of medications) {
            let normalizedMed = med.toLowerCase().replace(/\s+/g, ' ');
            if (refillData.includes(normalizedMed)) {
                return med;
            }
        }
        return null;
    }

    function formatMedication(medication) {
        return medication.replace(/\b(compound|brand|generic)\b|\(.*?\)/gi, '').trim();
    }

    function extractWeight(refillData) {
        const weightMatch = refillData.match(/What is your current weight in pounds \(lbs\)\?\n(\d+)/i);
        return weightMatch ? `<span style="background-color:#FFFF00">${weightMatch[1]} lbs</span>` : "N/A";
    }

    function extractDoseOrInjection(refillData, isInjectable) {
        if (isInjectable) {
            const injectionMatch = refillData.match(/How many injections.*?\n(\d+-\d+ injections|\d+ injections|\d+-\d+|\d+)/);
            return injectionMatch && injectionMatch[1] !== '-' && injectionMatch[1].trim() !== '' ? `<span style="background-color:#FFFF00">${injectionMatch[1].replace(/(\d+.*?)/, '$1 injections')}</span>` : "";
        } else {
            const doseMatch = refillData.match(/How many daily tablet or troche.*?\n(0-7 doses|8-14 doses|15-21 doses|22-28 doses|More than 28 doses)/);
            return doseMatch && doseMatch[1] !== '-' && doseMatch[1].trim() !== '' ? `<span style="background-color:#FFFF00">${doseMatch[1].replace('doses', 'tablets')}</span>` : "";
        }
    }

    function extractLastDoseDate(refillData) {
        const lastDoseMatch = refillData.match(/When was your last dose of medication\?.*?\n(>\d+ days|\d+-\d+ days|\d+ days)/);
        return lastDoseMatch && lastDoseMatch[1] !== '-' && lastDoseMatch[1].trim() !== '' ? `<span style="background-color:#FFFF00">${lastDoseMatch[1]}</span>` : "";
    }

    function extractBloodPressure(refillData) {
        const bpMatch = refillData.match(/What is your current or average blood pressure range\?.*?\n(<120\/80 \(Normal\)|120-129\/<80 \(Elevated\)|130-139\/80-89 \(High Stage 1\)|≥140\/90 \(High Stage 2\) - Provider visit required)/);
        return bpMatch ? `<span style="background-color:#FFFF00">${bpMatch[1]}</span>` : "N/A";
    }

    function extractHeartRate(refillData) {
        const hrMatch = refillData.match(/What is your current or average resting heart rate range\?.*?\n(<60 beats per minute \(Slow\)|60-100 beats per minute \(Normal\)|101-110 beats per minute \(Slightly Fast\) - Provider visit required|>110 beats per minute \(Fast\) - Provider visit required)/);
        return hrMatch ? `<span style="background-color:#FFFF00">${hrMatch[1]}</span>` : "N/A";
    }

    function extractMedicalHistoryChange(refillData) {
        const historyMatch = refillData.match(/Have there been any changes to your medical, social, or surgical history since your last visit with us\?\n(Yes|No)/i);
        return historyMatch ? (historyMatch[1].toLowerCase() === 'yes' ? `<span style="background-color:#FFFF00">${historyMatch[1]}</span>` : historyMatch[1]) : "N/A";
    }

    function extractApplicableConditions(refillData) {
        // Look for the pattern of this question followed by answers until the next question
        const questionPattern = /Do any of the following apply to you\?\n([\s\S]+?)(?=Are you currently taking|Have you had bariatric|What is your current|$)/i;
        const conditionsMatch = refillData.match(questionPattern);
        
        if (conditionsMatch) {
            // Get only the text between this question and the next one
            let conditionsText = conditionsMatch[1].trim();
            
            // Split the text by lines and clean up
            let conditions = conditionsText
                .split('\n')
                .map(item => item.trim())
                .filter(item => {
                    // Keep only non-empty items that aren't negations
                    if (!item) return false;
                    const lowerItem = item.toLowerCase();
                    return !["none of the above", "-", "n/a", "no", "none"].includes(lowerItem);
                });
            
            // Check if "None of the above" was specifically selected
            const hasNone = conditionsText.toLowerCase().includes("none of the above") && 
                            conditions.length <= 1; // Only count "None" if it's the only response
            
            if (hasNone) {
                return "None of the above";
            }
            
            return conditions.length > 0 
                ? `<span style="background-color:#FFFF00">${conditions.join(', ')}</span>` 
                : "None of the above";
        }
        return "None of the above";
    }

    function extractOpiateUse(refillData) {
        const opiateMatch = refillData.match(/Are you currently taking, plan to take, or have recently \(within the last 3 months\) taken opiate pain medications and\/or opiate-based street drugs\?\n(Yes|No|-|)/i);
        return opiateMatch ? (opiateMatch[1].toLowerCase() === 'yes' ? `<span style="background-color:#FFFF00">${opiateMatch[1]}</span>` : "No") : "No";
    }

    function extractBariatricSurgery(refillData) {
        const surgeryMatch = refillData.match(/Have you had bariatric \(weight loss\) surgery\?\n(.+)(?:\nPlease include date range and type of surgery\.\n(.+))?/i);
        
        if (surgeryMatch) {
            const response = surgeryMatch[1].trim();
            const details = surgeryMatch[2] ? surgeryMatch[2].trim() : "";
            
            const noSurgery = ["no", "none", "-", "n/a", ""].includes(response.toLowerCase());
            return noSurgery ? "No" : `<span style="background-color:#FFFF00">${response}${details ? " - " + details : ""}</span>`;
        }
        return "No";
    }
    
    function extractRecentConditions(refillData) {
        // Look for the specific pattern of this question followed by answers until the next question
        const questionPattern = /Do any of the following currently or recently apply to you\?\n([\s\S]+?)(?=Have there been any changes|What is your current|$)/i;
        const conditionsMatch = refillData.match(questionPattern);
        
        if (conditionsMatch) {
            // Get only the text between this question and the next one
            let conditionsText = conditionsMatch[1].trim();
            
            // Split the text by lines and clean up
            let conditions = conditionsText
                .split('\n')
                .map(item => item.trim())
                .filter(item => {
                    // Keep only non-empty items that aren't negations
                    if (!item) return false;
                    const lowerItem = item.toLowerCase();
                    return !["none of the above", "-", "n/a", "no", "none"].includes(lowerItem);
                });
            
            // Check if "None of the above" was specifically selected
            const hasNone = conditionsText.toLowerCase().includes("none of the above") && 
                            conditions.length <= 1; // Only count "None" if it's the only response
            
            if (hasNone) {
                return "None of the above";
            }
            
            return conditions.length > 0 
                ? `<span style="background-color:#FFFF00">${conditions.join(', ')}</span>` 
                : "None of the above";
        }
        return "None of the above";
    }
    
    function extractAllergyChanges(refillData) {
        const allergyMatch = refillData.match(/Have there been any changes to your allergies since your last visit with us\?\n(Yes|No|-|N\/A|)/i);
        return allergyMatch ? (allergyMatch[1].toLowerCase() === 'yes' ? `<span style="background-color:#FFFF00">${allergyMatch[1]}</span>` : "No") : "No";
    }

    function extractMedicationChanges(refillData) {
        const medicationMatch = refillData.match(/Have there been any changes to your medications since your last visit with us\?\n(Yes|No|-|N\/A|)/i);
        return medicationMatch ? (medicationMatch[1].toLowerCase() === 'yes' ? `<span style="background-color:#FFFF00">${medicationMatch[1]}</span>` : "No") : "No";
    }

    function extractSeriousSideEffects(refillData) {
        const seriousEffectsMatch = refillData.match(/Have you experienced any of the following since starting your medication\? Please select all that apply.\n(.+)/i);
        if (seriousEffectsMatch) {
            const seriousEffects = seriousEffectsMatch[1].trim();
            const noSeriousEffects = ["none of the above", "-", "n/a", "no", "none", ""].includes(seriousEffects.toLowerCase());
            return noSeriousEffects ? "None of the above" : `<span style="background-color:#FFFF00">${seriousEffects}</span>`;
        }
        return "None of the above";
    }

    function extractSideEffects(refillData) {
        // Look for this specific question and get everything until the next question
        const questionPattern = /Have you experienced any of the following since starting your medication\?\n([\s\S]+?)(?=What is your current|Do you have any further|Retail or Compound Pharmacy|$)/i;
        const sideEffectsMatch = refillData.match(questionPattern);
        
        if (sideEffectsMatch) {
            // Get the text between this question and the next one
            let sideEffectsText = sideEffectsMatch[1].trim();
            
            // Split by lines to separate the side effects and potential follow-up questions
            let lines = sideEffectsText.split('\n').map(line => line.trim()).filter(line => line);
            
            // Check if the user selected "None of the above"
            if (lines.some(line => line.toLowerCase() === "none of the above") && lines.length <= 2) {
                return "None of the above";
            }
            
            // Find the index of the "Please classify" line, if it exists
            const classifyIndex = lines.findIndex(line => line.toLowerCase().includes("please classify"));
            
            // If we found "Please classify", everything before it is a side effect
            // Otherwise, exclude the last line if it seems like part of another question
            let sideEffectsLines = [];
            if (classifyIndex !== -1) {
                sideEffectsLines = lines.slice(0, classifyIndex);
            } else {
                sideEffectsLines = lines;
            }
            
            // Filter out any "none" responses from side effects
            sideEffectsLines = sideEffectsLines.filter(line => 
                !["none of the above", "-", "n/a", "no", "none", ""].includes(line.toLowerCase())
            );
            
            if (sideEffectsLines.length === 0) return "None of the above";
            
            // Combine all side effects with a comma
            let sideEffects = sideEffectsLines.join(', ');
            
            // Look for severity classification in the extracted text
            const severityPattern = /Please classify\syour symptoms:\s*(.+)/i;
            const severityMatch = sideEffectsText.match(severityPattern);
            
            if (severityMatch) {
                sideEffects += ` - ${severityMatch[1].trim()}`;
            }
            
            return `<span style="background-color:#FFFF00">${sideEffects}</span>`;
        }
        return "None of the above";
    }

    function extractPharmacyInfo(refillData) {
        const pharmacyMatch = refillData.match(/Retail or Compound Pharmacy - please list the name of your current pharmacy\.\n(.+)/i);
        const addressMatch = refillData.match(/Please specify address of your current pharmacy\n(.+)/i);
        
        const pharmacyName = pharmacyMatch ? pharmacyMatch[1].trim() : "";
        const pharmacyAddress = addressMatch ? addressMatch[1].trim() : "";
        
        const noPharmacy = ["none", "-", "n/a", ""].includes(pharmacyName.toLowerCase());
        const noAddress = ["none", "-", "n/a", ""].includes(pharmacyAddress.toLowerCase());

        return noPharmacy && noAddress 
            ? "None" 
            : `<p><strong>Retail or Compound Pharmacy:</strong>${pharmacyName || "N/A"}</p>
               <p><strong>Pharmacy Address:</strong>${pharmacyAddress || "N/A"}</p>`;
    }

    function extractProviderNote(refillData) {
        const providerNoteMatch = refillData.match(/Do you have any further information which you would like the doctor to know\?.+\n(.+)/i);
        if (providerNoteMatch) {
            const providerNote = providerNoteMatch[1].trim();
            const noProviderNote = ["none of the above", "-", "n/a", "no", "none", ""].includes(providerNote.toLowerCase());
            return noProviderNote ? " " : `<span style="background-color:#FFFF00">Providers Note: "${providerNote}"</span>`;
        }
        return "";
    }

    processRefillBtn.addEventListener('click', function() {
        const refillData = refillDataTextarea.value;
                
        if (refillData.trim() === '') {
            alert('Please enter refill data');
            return;
        }

        const extractedMed = extractMedication(refillData);
        
        if (extractedMed) {
            const formattedMed = formatMedication(extractedMed);
            const isInjectable = extractedMed.toLowerCase().includes("injectable");
            const doseOrInjectionCount = extractDoseOrInjection(refillData, isInjectable);
            const lastDoseDate = extractLastDoseDate(refillData);
            const weight = extractWeight(refillData);
            const bloodPressure = extractBloodPressure(refillData);
            const heartRate = extractHeartRate(refillData);
            const medicalHistoryChange = extractMedicalHistoryChange(refillData);
            const applicableConditions = extractApplicableConditions(refillData);
            const opiateUse = extractOpiateUse(refillData);
            const bariatricSurgery = extractBariatricSurgery(refillData);
            const recentConditions = extractRecentConditions(refillData);
            const allergyChanges = extractAllergyChanges(refillData);
            const medicationChanges = extractMedicationChanges(refillData);
            const seriousSideEffects = extractSeriousSideEffects(refillData);
            const sideEffects = extractSideEffects(refillData);
            const providerNote = extractProviderNote(refillData);
            const pharmacyInfo = extractPharmacyInfo(refillData);
            
            resultDiv.innerHTML = `
                <p><strong>Current Weight:</strong> ${weight}</p>
                <h3>GPLANS Refill Visit Processing</h3>

                <p><strong>Preferred Medication:</strong><span style="background-color:#FFFF00"><strong> ${formattedMed}</strong></span></p>

                <p>${providerNote}</p>
                <h3><strong>Initial Visit: Successful on</strong></h3>
                <ul>
                    <li>The patient would like to start on X medication.</li>
                    <li>The patient has tried X/Y/Z medications in the past for weight loss.</li>
                    <li>Starting weight:</li>
                    <li>Starting BMI:</li>
                    <li>Goal weight:</li>
                    <li>Last labs completed:</li>
                    <li>Local pharmacy:</li>
                </ul>
                <h3><strong><span style="background-color:#FFFF00">Refill Visit</span></strong></h3>
                <ul>
                    <li>The patient is currently on <span style="background-color:#FFFF00"> X mg of ${formattedMed}</span> for the last Z weeks.</li>
                    <li>${isInjectable ? "Date of last injection:" : "Date of last doses:"} <span style="background-color:#FFFF00">${lastDoseDate}</span></li>
                    <li>${isInjectable ? `How many injections has the patient taken on the current dose: ${doseOrInjectionCount}` : `How many doses has the patient taken on the current dose: ${doseOrInjectionCount}`}</li>
                </ul>
                
                
                <h3>Vitals</h3>
                <p><strong>Current or Average Blood Pressure Range:</strong> ${bloodPressure}</p>
                <p><strong>Current or Average Resting Heart Rate Range:</strong> ${heartRate}</p>

                <h3>Medical History Changes</h3>
                <p><strong>Have there been any changes to your medical, social, or surgical history since your last visit with us?</strong><br> ${medicalHistoryChange}</br></p>

                <p><strong>Do any of the following apply to you?</strong><br>${applicableConditions}</br></p>

                <p><strong>Are you currently taking, plan to take, or have recently (within the last 3 months) taken opiate pain medications and/or opiate-based street drugs?</strong><br> ${opiateUse}<br></p>

                <p><strong>Have you had bariatric (weight loss) surgery?</strong><br> ${bariatricSurgery}</br></p>

                <p><strong>Do any of the following currently or recently apply to you?</strong><br> ${recentConditions}</br></p>

                <p><strong>Have there been any changes to your allergies since your last visit with us?</strong><br>${allergyChanges}</br></p>

                <p><strong>Have there been any changes to your medications since your last visit with us?</strong><br> ${medicationChanges}</br></p>

                <p><strong>Have you experienced any of the following since starting your medication? Please select all that apply.</strong><br> ${seriousSideEffects}</br></p>

                <p><strong>Have you experienced any of the following since starting your medication?(Side Effects)</strong><br> ${sideEffects}</br></p>

                ${pharmacyInfo}
                
            `;
        } else {
            resultDiv.innerHTML = `<p style='color: red;'>No recognized medication found in the input.</p>`;
        }
    });
};