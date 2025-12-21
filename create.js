// --- GLOBAL STATE ---
let currentCurrencySymbol = '₦';
const invoiceBody = document.getElementById('invoiceBody');

// --- UTILITY FUNCTIONS ---

function formatCurrency(number) {
    const num = parseFloat(number) || 0;
    // Map currency selector values to actual symbols if needed
    const symbol = document.getElementById('currencySelector').value;
    return `${symbol}${num.toFixed(2)}`;
}

function cleanNumber(value) {
    return parseFloat(String(value).replace(/[^0-9.]/g, '')) || 0;
}

function updateDraftMessage() {
    const timestamp = localStorage.getItem('invoiceDraftTimestamp');
    const draftMessage = document.getElementById('draftMessage');
    if (timestamp) {
        const date = new Date(parseInt(timestamp));
        draftMessage.textContent = `Draft saved: ${date.toLocaleTimeString()}`;
    } else {
        draftMessage.textContent = 'No draft saved yet.';
    }
}

// --- LOGO & LIVE-SYNC LOGIC ---

// Updates the H1 title in real-time as user types in the "Your Details" input
const bizNameInput = document.getElementById('businessNameInput');
const liveHeaderTitle = document.getElementById('live-business-name');

bizNameInput.addEventListener('input', () => {
    liveHeaderTitle.textContent = bizNameInput.value || "Business Name";
    saveInvoiceDraft();
});

// Logo Upload Handler
const logoInput = document.getElementById('logo-input');
const logoPreviewImg = document.getElementById('logo-preview-img');
const logoToggle = document.getElementById('enable-logo-checkbox');

logoInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            logoPreviewImg.src = event.target.result;
            logoPreviewImg.style.display = 'block';
            localStorage.setItem('invoiceLogoData', event.target.result); // Save logo to draft
        };
        reader.readAsDataURL(file);
    }
});

// Logo Toggle Visibility
logoToggle.addEventListener('change', function() {
    logoPreviewImg.style.display = (this.checked && logoPreviewImg.src.includes('data:image')) ? 'block' : 'none';
});

// --- DYNAMIC ITEM FUNCTIONS ---

function calculateLineTotal(row) {
    const qty = cleanNumber(row.querySelector('.item-qty').value);
    const price = cleanNumber(row.querySelector('.item-price').value);
    row.querySelector('.line-item-total').textContent = formatCurrency(qty * price);
    updateGrandTotal();
}

function updateGrandTotal() {
    let subTotal = 0;
    document.querySelectorAll('.line-item').forEach(row => {
        const qty = cleanNumber(row.querySelector('.item-qty').value);
        const price = cleanNumber(row.querySelector('.item-price').value);
        subTotal += qty * price;
    });

    const taxRate = cleanNumber(document.getElementById('taxRate').value);
    const taxAmount = subTotal * (taxRate / 100);
    const grandTotal = subTotal + taxAmount;

    document.getElementById('subTotalDisplay').textContent = formatCurrency(subTotal);
    document.getElementById('taxRateDisplay').textContent = taxRate;
    document.getElementById('taxAmountDisplay').textContent = formatCurrency(taxAmount);
    document.getElementById('grandTotalDisplay').textContent = formatCurrency(grandTotal);

    clearTimeout(window.saveTimer);
    window.saveTimer = setTimeout(saveInvoiceDraft, 1000); 
}

function addLineItem(description = '', qty = 1, price = 0) {
    const row = document.createElement('tr');
    row.className = 'line-item';
    row.innerHTML = `
        <td><button class="remove-item-btn" title="Remove Item">&times;</button></td>
        <td><input type="text" class="item-description" placeholder="Service description" value="${description}"></td>
        <td><input type="number" class="item-qty" value="${qty}" min="1"></td>
        <td><input type="number" class="item-price" value="${price}" min="0" step="0.01"></td>
        <td class="line-item-total" style="text-align:right">${formatCurrency(qty * price)}</td>
    `;

    row.querySelectorAll('input').forEach(input => {
        input.addEventListener('input', () => calculateLineTotal(row));
    });

    row.querySelector('.remove-item-btn').addEventListener('click', () => {
        row.remove();
        updateGrandTotal();
    });

    invoiceBody.appendChild(row);
    updateGrandTotal();
}

// --- PERSISTENCE ---

function saveInvoiceDraft() {
    const invoiceData = {
        settings: {
            brandColor: document.getElementById('brandColorPicker').value,
            currency: document.getElementById('currencySelector').value,
            taxRate: document.getElementById('taxRate').value,
            logoEnabled: logoToggle.checked
        },
        invoiceNumber: document.getElementById('invoiceNumber').value,
        businessInfo: {
            name: bizNameInput.value,
            address: document.getElementById('businessAddress').value,
            email: document.getElementById('businessEmail').value,
        },
        clientInfo: {
            name: document.getElementById('clientName').value,
            address: document.getElementById('clientAddress').value,
            email: document.getElementById('clientEmail').value,
        },
        paymentDetails: {
            accNo: document.getElementById('bank-acc-no').value,
            accName: document.getElementById('bank-acc-name').value,
            bank: document.getElementById('bank-name').value,
            terms: document.getElementById('payment-terms').value
        },
        lineItems: []
    };

    document.querySelectorAll('.line-item').forEach(row => {
        invoiceData.lineItems.push({
            description: row.querySelector('.item-description').value,
            qty: row.querySelector('.item-qty').value,
            price: row.querySelector('.item-price').value
        });
    });

    localStorage.setItem('invoiceDraft', JSON.stringify(invoiceData));
    localStorage.setItem('invoiceDraftTimestamp', Date.now());
    updateDraftMessage();
}

function loadInvoiceDraft() {
    const draftJson = localStorage.getItem('invoiceDraft');
    const savedLogo = localStorage.getItem('invoiceLogoData');

    if (savedLogo) {
        logoPreviewImg.src = savedLogo;
        logoPreviewImg.style.display = 'block';
    }

    if (!draftJson) return;
    const draft = JSON.parse(draftJson);

    // Load Settings
    document.getElementById('brandColorPicker').value = draft.settings.brandColor;
    document.documentElement.style.setProperty('--primary-color', draft.settings.brandColor);
    document.getElementById('currencySelector').value = draft.settings.currency;
    document.getElementById('taxRate').value = draft.settings.taxRate;
    logoToggle.checked = draft.settings.logoEnabled;

    // Load Info
    bizNameInput.value = draft.businessInfo.name;
    liveHeaderTitle.textContent = draft.businessInfo.name || "Business Name";
    document.getElementById('businessAddress').value = draft.businessInfo.address;
    document.getElementById('businessEmail').value = draft.businessInfo.email;
    
    document.getElementById('invoiceNumber').value = draft.invoiceNumber;
    document.getElementById('bank-acc-no').value = draft.paymentDetails.accNo;
    document.getElementById('bank-acc-name').value = draft.paymentDetails.accName;
    document.getElementById('bank-name').value = draft.paymentDetails.bank;
    document.getElementById('payment-terms').value = draft.paymentDetails.terms;

    // Load Items
    invoiceBody.innerHTML = '';
    draft.lineItems.forEach(item => addLineItem(item.description, item.qty, item.price));
    
    updateGrandTotal();
}



// --- PDF GENERATION (The Professional Way) ---

function generatePDF() {
    const element = document.getElementById('invoice-canvas'); // The container
    const invoiceNum = document.getElementById('invoiceNumber').value;

    const opt = {
        margin: 0,
        filename: `Invoice_${invoiceNum}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,             // High resolution
            useCORS: true, 
            letterRendering: true,
            // --- THE CRITICAL FIXES BELOW ---
            width: 800,           // Force the capture width to match your CSS
            windowWidth: 800,     // Prevents the "shifting to the left" issue
            x: 0,                 // Ensures the "camera" starts at the edge of the element
            scrollY: 0            // Prevents clipping if you've scrolled down the page
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    const termsArea = document.getElementById('payment-terms');
    
    // This looks for newline characters and replaces them with HTML breaks
    const formattedText = termsArea.value.replace(/\n/g, '<br>')

    html2pdf().set(opt).from(element).save();
}

// --- INITIALIZATION ---

document.addEventListener('DOMContentLoaded', () => {
    loadInvoiceDraft();
    
    document.getElementById('brandColorPicker').addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--primary-color', e.target.value);
        saveInvoiceDraft();
    });
    
    document.getElementById('addLineItemBtn').addEventListener('click', () => addLineItem());
    document.getElementById('downloadPdfBtn').addEventListener('click', generatePDF);
    document.getElementById('currencySelector').addEventListener('change', updateGrandTotal);
    document.getElementById('taxRate').addEventListener('input', updateGrandTotal);

    if (invoiceBody.children.length === 0) addLineItem();


    
});

