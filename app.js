// Localization configuration - change this object for different markets
const APP_CONFIG = {
    currencyPrefix: "KSh",
    currencyLocale: "en-KE",
    defaultBudget: 30000,
    storageKey: "dishi_expenses",
    budgetKey: "dishi_budget",
    appName: "Dishi"
    // Uganda:   currencyPrefix: "UGX", currencyLocale: "en-UG"
    // Tanzania: currencyPrefix: "TZS", currencyLocale: "en-TZ"
    // Nigeria:  currencyPrefix: "NGN", currencyLocale: "en-NG"
};

// Seed data for development and testing
const SEED_DATA = [
    { description: "Matatu CBD to Westlands", amount: 50, category: "transport", date: "2026-06-26", paymentMethod: "cash" },
    { description: "Lunch at Kenchic Inn", amount: 350, category: "food", date: "2026-06-26", paymentMethod: "mpesa" },
    { description: "Safaricom 1GB Data Bundle", amount: 99, category: "airtime", date: "2026-06-25", paymentMethod: "mpesa" },
    { description: "Python Textbook - Text Book Centre", amount: 1800, category: "education", date: "2026-06-24", paymentMethod: "card" },
    { description: "Westlands Sports Club Gym", amount: 500, category: "health", date: "2026-06-23", paymentMethod: "mpesa" }
];

// Core state
let expenses = JSON.parse(localStorage.getItem(APP_CONFIG.storageKey)) || [];
let monthlyBudget = parseFloat(localStorage.getItem(APP_CONFIG.budgetKey)) || APP_CONFIG.defaultBudget;

// Category display names
const CATEGORY_NAMES = {
    food: "Food and Drinks",
    transport: "Transport",
    housing: "Rent and Housing",
    airtime: "Airtime and Data",
    health: "Health and Medical",
    entertainment: "Entertainment",
    education: "Education",
    other: "Other"
};

// Payment method display names
const PAYMENT_NAMES = {
    mpesa: "M-Pesa",
    cash: "Cash",
    card: "Card"
};

// Utility function to format currency
function formatKES(amount) {
    return `${APP_CONFIG.currencyPrefix} ${amount.toLocaleString(APP_CONFIG.currencyLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Utility function to format date
function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = { day: '2-digit', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('en-GB', options);
}

// Save to localStorage
function saveToStorage() {
    localStorage.setItem(APP_CONFIG.storageKey, JSON.stringify(expenses));
    localStorage.setItem(APP_CONFIG.budgetKey, monthlyBudget.toString());
}

// Load from localStorage
function loadFromStorage() {
    expenses = JSON.parse(localStorage.getItem(APP_CONFIG.storageKey)) || [];
    monthlyBudget = parseFloat(localStorage.getItem(APP_CONFIG.budgetKey)) || APP_CONFIG.defaultBudget;
}

// Filter expenses based on current filter values
function filterExpenses() {
    const categoryFilter = document.getElementById('filter-category').value;
    const paymentFilter = document.getElementById('filter-payment').value;
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const sortBy = document.getElementById('sort-select').value;

    let filtered = expenses.filter(expense => {
        const matchesCategory = !categoryFilter || expense.category === categoryFilter;
        const matchesPayment = !paymentFilter || expense.paymentMethod === paymentFilter;
        const matchesSearch = !searchTerm || expense.description.toLowerCase().includes(searchTerm);
        return matchesCategory && matchesPayment && matchesSearch;
    });

    // Sort filtered results
    switch (sortBy) {
        case 'newest':
            filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            break;
        case 'oldest':
            filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            break;
        case 'highest':
            filtered.sort((a, b) => b.amount - a.amount);
            break;
        case 'lowest':
            filtered.sort((a, b) => a.amount - b.amount);
            break;
    }

    return filtered;
}

// Update budget progress bar
function updateBudgetBar() {
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const percentage = monthlyBudget > 0 ? (totalSpent / monthlyBudget) * 100 : 0;
    const progressBar = document.getElementById('budget-progress');
    const percentageText = document.getElementById('budget-percentage');
    const overBudgetAlert = document.getElementById('over-budget-alert');

    // Clamp percentage to 100 for display
    const displayPercentage = Math.min(percentage, 100);
    progressBar.style.width = `${displayPercentage}%`;
    percentageText.textContent = `${percentage.toFixed(1)}% of budget used`;

    // Update color based on thresholds
    if (percentage >= 90) {
        progressBar.className = 'bg-red-500 h-3 rounded-full transition-all duration-300';
        overBudgetAlert.classList.remove('hidden');
    } else if (percentage >= 70) {
        progressBar.className = 'bg-yellow-500 h-3 rounded-full transition-all duration-300';
        overBudgetAlert.classList.add('hidden');
    } else {
        progressBar.className = 'bg-primary h-3 rounded-full transition-all duration-300';
        overBudgetAlert.classList.add('hidden');
    }
}

// Update summary dashboard
function updateSummary() {
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const budgetRemaining = monthlyBudget - totalSpent;
    
    // Count expenses for current month
    const now = new Date();
    const currentMonthExpenses = expenses.filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear();
    });

    // Calculate top category
    const categoryTotals = {};
    expenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });
    
    let topCategory = '—';
    let maxAmount = 0;
    for (const [category, amount] of Object.entries(categoryTotals)) {
        if (amount > maxAmount) {
            maxAmount = amount;
            topCategory = CATEGORY_NAMES[category];
        }
    }

    // Update DOM
    document.getElementById('total-spent').textContent = formatKES(totalSpent);
    document.getElementById('budget-remaining').textContent = formatKES(budgetRemaining);
    document.getElementById('expense-count').textContent = currentMonthExpenses.length;
    document.getElementById('top-category').textContent = topCategory;
    document.getElementById('monthly-budget').value = monthlyBudget;

    updateBudgetBar();
}

// Render expense list
function renderExpenses() {
    const expenseList = document.getElementById('expense-list');
    const filteredExpenses = filterExpenses();

    if (filteredExpenses.length === 0) {
        expenseList.innerHTML = '<p class="text-gray-500 text-center py-8">No expenses yet. Start tracking today.</p>';
        return;
    }

    expenseList.innerHTML = filteredExpenses.map((expense, index) => {
        const paymentBadgeClass = {
            mpesa: 'bg-green-100 text-green-800',
            cash: 'bg-gray-100 text-gray-800',
            card: 'bg-blue-100 text-blue-800'
        }[expense.paymentMethod];

        // Find original index for delete functionality
        const originalIndex = expenses.findIndex(e => e.id === expense.id);

        return `
            <div class="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="text-xs font-medium text-gray-500 uppercase">${CATEGORY_NAMES[expense.category]}</span>
                            <span class="px-2 py-1 text-xs font-medium rounded-full ${paymentBadgeClass}">${PAYMENT_NAMES[expense.paymentMethod]}</span>
                        </div>
                        <h3 class="font-medium text-gray-900">${expense.description}</h3>
                        <p class="text-sm text-gray-500">${formatDate(expense.date)}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-gray-900">${formatKES(expense.amount)}</p>
                        <button onclick="deleteExpense(${originalIndex})" class="text-red-500 text-sm hover:text-red-700 mt-2">
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Add new expense
function addExpense(event) {
    event.preventDefault();

    // Get form values
    const description = document.getElementById('expense-description').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const category = document.getElementById('expense-category').value;
    const date = document.getElementById('expense-date').value;
    const paymentMethod = document.querySelector('input[name="expense-payment"]:checked')?.value;

    // Reset errors
    document.querySelectorAll('[id^="error-"]').forEach(el => {
        el.classList.add('hidden');
        el.textContent = '';
    });

    let isValid = true;

    // Validate description
    if (!description || description.length < 3) {
        const errorEl = document.getElementById('error-description');
        errorEl.textContent = 'Description must be at least 3 characters';
        errorEl.classList.remove('hidden');
        isValid = false;
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0 || amount > 1000000) {
        const errorEl = document.getElementById('error-amount');
        errorEl.textContent = 'Amount must be greater than 0 and less than 1,000,000';
        errorEl.classList.remove('hidden');
        isValid = false;
    }

    // Validate category
    if (!category) {
        const errorEl = document.getElementById('error-category');
        errorEl.textContent = 'Please select a category';
        errorEl.classList.remove('hidden');
        isValid = false;
    }

    // Validate date
    if (!date) {
        const errorEl = document.getElementById('error-date');
        errorEl.textContent = 'Please select a date';
        errorEl.classList.remove('hidden');
        isValid = false;
    }

    // Validate payment method
    if (!paymentMethod) {
        const errorEl = document.getElementById('error-payment');
        errorEl.textContent = 'Please select a payment method';
        errorEl.classList.remove('hidden');
        isValid = false;
    }

    if (!isValid) return;

    // Create expense object
    const newExpense = {
        id: Date.now(),
        description: description,
        amount: amount,
        category: category,
        date: date,
        paymentMethod: paymentMethod,
        createdAt: new Date().toISOString()
    };

    // Add to array and save
    expenses.push(newExpense);
    saveToStorage();

    // Reset form
    document.getElementById('expense-form').reset();
    document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];

    // Update UI
    renderExpenses();
    updateSummary();
}

// Delete expense
function deleteExpense(index) {
    expenses.splice(index, 1);
    saveToStorage();
    renderExpenses();
    updateSummary();
}

// Export to CSV
function exportCSV() {
    if (expenses.length === 0) {
        alert('No expenses to export');
        return;
    }

    const headers = ['Date', 'Description', 'Category', 'Amount (KSh)', 'Payment Method'];
    const rows = expenses.map(exp => [
        exp.date,
        `"${exp.description}"`,
        CATEGORY_NAMES[exp.category],
        exp.amount.toFixed(2),
        PAYMENT_NAMES[exp.paymentMethod]
    ]);

    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'dishi_expenses.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialize app
function init() {
    // Load data from storage or use seed data if empty
    loadFromStorage();
    
    if (expenses.length === 0) {
        // Add seed data with IDs and timestamps
        expenses = SEED_DATA.map(item => ({
            ...item,
            id: Date.now() + Math.random(),
            createdAt: new Date(item.date).toISOString()
        }));
        saveToStorage();
    }

    // Set default date to today
    document.getElementById('expense-date').value = new Date().toISOString().split('T')[0];

    // Set initial budget
    document.getElementById('monthly-budget').value = monthlyBudget;

    // Render initial state
    renderExpenses();
    updateSummary();

    // Event listeners
    document.getElementById('expense-form').addEventListener('submit', addExpense);
    document.getElementById('btn-export-csv').addEventListener('click', exportCSV);
    
    // Budget change listener
    document.getElementById('monthly-budget').addEventListener('change', (e) => {
        monthlyBudget = parseFloat(e.target.value) || APP_CONFIG.defaultBudget;
        saveToStorage();
        updateSummary();
    });

    // Filter and search listeners
    document.getElementById('filter-category').addEventListener('change', renderExpenses);
    document.getElementById('filter-payment').addEventListener('change', renderExpenses);
    document.getElementById('search-input').addEventListener('input', renderExpenses);
    document.getElementById('sort-select').addEventListener('change', renderExpenses);
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
