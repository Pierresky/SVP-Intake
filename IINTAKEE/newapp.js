document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const vendorSelection = document.getElementById('vendor-selection');
    const workflow = document.getElementById('workflow');
    const vendorNameDisplay = document.getElementById('vendor-name');
    const backToVendorsBtn = document.getElementById('back-to-vendors');
    const initialVisitBtn = document.getElementById('initial-visit-btn');
    const refillVisitBtn = document.getElementById('refill-visit-btn');
    const initialSection = document.getElementById('initial-section');
    const refillSection = document.getElementById('refill-section');
    const processInitialBtn = document.getElementById('process-initial-btn');
    const processRefillBtn = document.getElementById('process-refill-btn');
    const intakeDataTextarea = document.getElementById('intakeData');
    const refillDataTextarea = document.getElementById('refillData');
    const resultDiv = document.getElementById('result');
    
    // Vendor buttons
    const gplansBtn = document.getElementById('gplans-btn');
    const redboxBtn = document.getElementById('redbox-btn');
    const trimrxBtn = document.getElementById('trimrx-btn');
    
    // Current vendor tracking
    let currentVendor = null;
    
    // Initial state setup - hide workflow
    workflow.classList.add('hidden');
    backToVendorsBtn.classList.add('hidden');
    
    // Reset visit toggle (show initial visit, hide refill visit)
    function resetVisitToggle() {
        initialVisitBtn.classList.add('active');
        refillVisitBtn.classList.remove('active');
        initialSection.classList.remove('hidden');
        refillSection.classList.add('hidden');
    }
    
    // Clear all data fields and results
    function clearData() {
        intakeDataTextarea.value = '';
        refillDataTextarea.value = '';
        resultDiv.innerHTML = '';
    }
    
    // Visit toggle logic
    initialVisitBtn.addEventListener('click', () => {
        initialVisitBtn.classList.add('active');
        refillVisitBtn.classList.remove('active');
        initialSection.classList.remove('hidden');
        refillSection.classList.add('hidden');
    });
    
    refillVisitBtn.addEventListener('click', () => {
        refillVisitBtn.classList.add('active');
        initialVisitBtn.classList.remove('active');
        refillSection.classList.remove('hidden');
        initialSection.classList.add('hidden');
    });
    
    // Reset the app state when changing vendors
    backToVendorsBtn.addEventListener('click', () => {
        // Hide workflow, show vendor selection
        workflow.classList.add('hidden');
        vendorSelection.classList.remove('hidden');
        backToVendorsBtn.classList.add('hidden');
        
        // Clear vendor-specific data
        clearData();
        resetVisitToggle();
        currentVendor = null;
        
        // Remove previous vendor script if any
        const oldScript = document.getElementById('vendor-script');
        if (oldScript) {
            oldScript.remove();
        }
        
        // Remove event listeners from process buttons
        processInitialBtn.onclick = null;
        processRefillBtn.onclick = null;
    });
    
    // Helper function to load vendor-specific script
    function loadVendorScript(vendorName) {
        // Remove any previously loaded vendor script
        const oldScript = document.getElementById('vendor-script');
        if (oldScript) {
            oldScript.remove();
        }
        
        // Create new script element
        const script = document.createElement('script');
        script.id = 'vendor-script';
        script.src = `vendors/${vendorName.toLowerCase()}.js`;
        document.body.appendChild(script);
        
        // Wait for script to load then initialize vendor
        script.onload = () => {
            if (window.initVendor && typeof window.initVendor === 'function') {
                window.initVendor(processInitialBtn, processRefillBtn, intakeDataTextarea, refillDataTextarea, resultDiv);
            } else {
                console.error(`Vendor script for ${vendorName} loaded but initVendor function not found`);
            }
        };
    }
    
    // Vendor selection handlers
    gplansBtn.addEventListener('click', () => {
        currentVendor = 'GPLANS';
        vendorNameDisplay.textContent = 'GPLANS';
        vendorSelection.classList.add('hidden');
        workflow.classList.remove('hidden');
        backToVendorsBtn.classList.remove('hidden');
        clearData();
        resetVisitToggle();
        loadVendorScript('gplan');
    });
    
    redboxBtn.addEventListener('click', () => {
        currentVendor = 'REDBOX';
        vendorNameDisplay.textContent = 'REDBOX';
        vendorSelection.classList.add('hidden');
        workflow.classList.remove('hidden');
        backToVendorsBtn.classList.remove('hidden');
        clearData();
        resetVisitToggle();
        loadVendorScript('redbox');
    });
    
    trimrxBtn.addEventListener('click', () => {
        currentVendor = 'TRIMRX';
        vendorNameDisplay.textContent = 'TRIMRX';
        vendorSelection.classList.add('hidden');
        workflow.classList.remove('hidden');
        backToVendorsBtn.classList.remove('hidden');
        clearData();
        resetVisitToggle();
        loadVendorScript('trimrx');
    });
});