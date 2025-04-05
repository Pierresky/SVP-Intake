// REDBOX Vendor Script
window.initVendor = function(processInitialBtn, processRefillBtn, intakeDataTextarea, refillDataTextarea, resultDiv) {
    console.log("REDBOX vendor script loaded");
    
    // Initial visit processing
    processInitialBtn.addEventListener('click', function() {
        const intakeData = intakeDataTextarea.value;
        
        if (intakeData.trim() === '') {
            alert('Please enter intake data');
            return;
        }

        // Extract sex
        const sexMatch = intakeData.match(/What sex is listed on your birth certificate\?\s*(Male|Female)/i);
        let RBIsex = "male / female";
        if (sexMatch) {
            const detectedSex = sexMatch[1].toLowerCase();
            RBIsex = RBIsex.replace(new RegExp(detectedSex, 'i'), '<span style="background-color: #ffff00">' + detectedSex + '</span>');
        }

        // Extract weight
        const weightMatch = intakeData.match(/Weight \(lbs\.\)\s*(\d+)/i);
        const RBIweight = weightMatch ? weightMatch[1] : 'Unknown';

        // Extract BMI
        const bmiMatch = intakeData.match(/BMI\s*(\d+\.?\d*)/i);
        const RBIbmi = bmiMatch ? bmiMatch[1] : 'Unknown';

        // Extract weight loss goal
        const goalMatch = intakeData.match(/What is your weight loss goal\?\s*(.*)/i);
        let RBIgoalWeight = goalMatch ? goalMatch[1].trim() : '';
        const validGoals = [
            "Lose 1-20 Ibs",
            "Lose 21-50 Ibs",
            "Lose over 50 Ibs",
            "Maintain my current weight",
            "Haven't decided"
        ];

        if (["-", "none", ""].includes(RBIgoalWeight.toLowerCase())) {
            RBIgoalWeight = "";
        } else if (!validGoals.includes(RBIgoalWeight) && !RBIgoalWeight.match(/^\d+$/)) {
            RBIgoalWeight = "";
        }

        if (RBIgoalWeight) {
            RBIgoalWeight = `<span style="background-color: #ffff00">${RBIgoalWeight}</span>`;
        }

        // Extract medication use for weight loss
        const medMatch = intakeData.match(/Have you taken medication for weight loss in the last 12 months\?\s*(.*)/i);
        let RBImedication = "<span style=\"background-color: #ffff00\">denied</span>";

        if (medMatch) {
            const answer = medMatch[1].trim().toLowerCase();
            if (answer.includes("glp-1")) {
                RBImedication = "<span style=\"background-color: #ffff00\">GLP-1 medication</span>";
            } else if (answer.includes("another medication")) {
                RBImedication = "<span style=\"background-color: #ffff00\">Another weight loss medication</span>";
            } else if (answer.toLowerCase() !== "no") {
                RBImedication = `<span style=\"background-color: #ffff00\">${answer}</span>`;
            }
        }

        // Extract preferred medication
        const preferredMedMatch = intakeData.match(/Weight Management Preferred Medication\|wm-preferred\s*(.*)/i);
        let RBIpreferredMed = "";
        
        if (preferredMedMatch) {
            const preferredMed = preferredMedMatch[1].trim().split(" ").slice(0, 3).join(" ");
            RBIpreferredMed = `<span style="background-color: #ffff00">${preferredMed}</span>`;
        }

        // Extract nausea prescription request
        const nauseaMatch = intakeData.match(/Would you like a prescription for ondansetron \(Zofran\)\?.*?\s*(Yes|No)/i);
        let providerNote = "";

        if (nauseaMatch && nauseaMatch[1].toLowerCase() === "yes") {
            providerNote = `<p><b><span style="background-color: #ffff00">Providers Note: The patient is requesting anti-nausea medication</span></b></p>`;
        }

        // Extract blood pressure
        let bloodPressure = 'X';
        const bpMatch = intakeData.match(/What is your average blood pressure\?\n(.+)/);
        if (bpMatch) {
            bloodPressure = bpMatch[1].trim();
        }

        // Extract resting heart rate
        let heartRate = 'X';
        const hrMatch = intakeData.match(/What is your average heart rate?\?\n(.+)/);
        if (hrMatch) {
            heartRate = hrMatch[1].trim();
        }


        // Extract surgical history properly
        let surgicalHistory = "Denies any surgical history including bariatric surgery.";
        const surgeryMatch = /Have you had bariatric \(weight loss\) surgery or any abdominal\/pelvic surgeries\?\n([^\n]+)/.exec(intakeData);

        if (surgeryMatch) {
            let surgeryResponse = surgeryMatch[1].trim();
            if (surgeryResponse.toLowerCase() === "yes") {
                surgicalHistory = `<span style="background-color:#FFFF00">History of: Bariatric surgery</span>.`;
            } else if (surgeryResponse.toLowerCase() !== "no") {
                surgicalHistory = `<span style="background-color:#FFFF00">History of: ${surgeryResponse}</span>.`;
            }
        }

        const conditions = /Do any of the following apply to you\?\n([\s\S]*?)(?:\nDo any of the following apply to you|$)/.exec(intakeData);

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

        // Format the extracted data
        const RedBoxresult = `
            ${providerNote}
            <br>
            <p>This is a __ y/o <b>obese / overweight ${RBIsex} </b> who is seeking medical weight loss treatment.</p>
            <br>
            <br>
            <h3><b><span style="background-color: #ffff00">Initial Visit:</span></b></h3>
            <ul>
                <li>Comorbidities:</li>
                <li>Medication(s) patient has tried in the past for weight loss: ${RBImedication}</li>
                <li>Medication patient would like to start on today: ${RBIpreferredMed}</li>
                <li>Initial visit weight: <span style="background-color: #ffff00">${RBIweight} lbs</span></li>
                <li>Initial visit BMI: <span style="background-color: #ffff00">${RBIbmi}</span></li>
                <li>Patient's goal weight: ${RBIgoalWeight}</li>
                <li>Patient's goal BMI:</li>
            </ul>

            <h3><b>Follow-Up Visit:</b></h3>
            <ul>
                <li>Patient is currently on the following medication:
                    <ul>
                        <li>Name, mg dose, and compound pharmacy (if applicable):</li>
                        <li>For the past __ weeks:</li>
                    </ul>
                </li>
            </ul>

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


            <h3><strong>Vitals</strong></h3>
            <p>Current or average blood pressure range:</p>
            <p> <span style="background-color:#FFFF00">${bloodPressure}</span></p>
            <p>Current or average resting heart rate range:</p>
            <p> <span style="background-color:#FFFF00">${heartRate}</span></p>
        `;
        
        resultDiv.innerHTML = RedBoxresult;
    });
    
    // Refill visit processing
    processRefillBtn.onclick = function() {
        const refillData = refillDataTextarea.value;
        
        if (refillData.trim() === '') {
            alert('Please enter refill data');
            return;
        }
        
        // Add your REDBOX refill visit processing logic here
        resultDiv.innerHTML = "<h2>REDBOX Refill Visit Processing</h2><p>Your REDBOX refill data would be processed here.</p>";
    };
};