/**
 * Smart Expense Tracker - Main JavaScript
 * All rights reserved by Md. Ashikur Rahman (1244050)
 * This project was created with the assistance of Cat AI.
 */

// ==========================================
// Configuration & Constants
// ==========================================

const API_BASE_URL = 'http://localhost:5000/api';
const STORAGE_KEYS = {
    THEME: 'expense_tracker_theme',
};

// DOM Elements Cache
const DOM = {};

// Chart Instances
let charts = {
    expensePie: null,
    incomeExpenseBar: null,
    savingsLine: null,
    budgetUsage: null
};

// State
let transactions = [];
let currentTransactionId = null;
let deleteTargetId = null;

// ==========================================
// DOM Reference Initialization
// ==========================================

function initDOMReferences() {
    // Dashboard
    DOM.balanceDisplay = document.getElementById('balanceDisplay');
    DOM.incomeDisplay = document.getElementById('incomeDisplay');
    DOM.expenseDisplay = document.getElementById('expenseDisplay');
    DOM.savingsDisplay = document.getElementById('savingsDisplay');
    DOM.savingsRateDisplay = document.getElementById('savingsRateDisplay');
    DOM.healthScoreDisplay = document.getElementById('healthScoreDisplay');
    DOM.budgetRemainingDisplay = document.getElementById('budgetRemainingDisplay');
    DOM.budgetProgressBar = document.getElementById('budgetProgressBar');
    DOM.adviceContainer = document.getElementById('adviceContainer');
    
    // Transactions
    DOM.transactionsBody = document.getElementById('transactionsBody');
    DOM.emptyTransactions = document.getElementById('emptyTransactions');
    DOM.searchInput = document.getElementById('searchInput');
    DOM.typeFilter = document.getElementById('typeFilter');
    DOM.categoryFilter = document.getElementById('categoryFilter');
    DOM.sortFilter = document.getElementById('sortFilter');
    DOM.addTransactionBtn = document.getElementById('addTransactionBtn');
    
    // Modal
    DOM.transactionModal = document.getElementById('transactionModal');
    DOM.modalTitle = document.getElementById('modalTitle');
    DOM.transactionForm = document.getElementById('transactionForm');
    DOM.transactionId = document.getElementById('transactionId');
    DOM.formTitle = document.getElementById('formTitle');
    DOM.formAmount = document.getElementById('formAmount');
    DOM.formDate = document.getElementById('formDate');
    DOM.formType = document.getElementById('formType');
    DOM.formCategory = document.getElementById('formCategory');
    DOM.formNotes = document.getElementById('formNotes');
    DOM.submitTransactionBtn = document.getElementById('submitTransactionBtn');
    DOM.closeModal = document.getElementById('closeModal');
    DOM.cancelModalBtn = document.getElementById('cancelModalBtn');
    
    // Confirmation Dialog
    DOM.confirmDialog = document.getElementById('confirmDialog');
    DOM.confirmMessage = document.getElementById('confirmMessage');
    DOM.confirmYesBtn = document.getElementById('confirmYesBtn');
    DOM.confirmNoBtn = document.getElementById('confirmNoBtn');
    
    // Sidebar
    DOM.sidebar = document.getElementById('sidebar');
    DOM.openSidebar = document.getElementById('openSidebar');
    DOM.closeSidebar = document.getElementById('closeSidebar');
    DOM.mobileOverlay = document.getElementById('mobileOverlay');
    
    // Theme
    DOM.themeToggle = document.getElementById('themeToggle');
    
    // Toast
    DOM.toast = document.getElementById('toast');
    DOM.toastMessage = document.getElementById('toastMessage');
    DOM.toastIcon = document.getElementById('toastIcon');
    
    // Loading
    DOM.loadingSpinner = document.getElementById('loadingSpinner');
    
    // Reports
    DOM.printReportBtn = document.getElementById('printReportBtn');
    DOM.exportJsonBtn = document.getElementById('exportJsonBtn');
    DOM.importJsonBtn = document.getElementById('importJsonBtn');
    DOM.jsonFileInput = document.getElementById('jsonFileInput');
    DOM.reportIncome = document.getElementById('reportIncome');
    DOM.reportExpense = document.getElementById('reportExpense');
    DOM.reportSavings = document.getElementById('reportSavings');
    DOM.reportCount = document.getElementById('reportCount');
    
    // Analysis
    DOM.insightsContainer = document.getElementById('insightsContainer');
    DOM.emergencyFundContainer = document.getElementById('emergencyFundContainer');
    
    // Current Date
    DOM.currentDate = document.getElementById('currentDate');
    
    // Navigation
    DOM.navLinks = document.querySelectorAll('.nav-link');
    DOM.sections = {
        dashboard: document.getElementById('dashboard'),
        transactions: document.getElementById('transactions'),
        analysis: document.getElementById('analysis'),
        reports: document.getElementById('reports'),
        support: document.getElementById('support')
    };
}

// ==========================================
// Utility Functions
// ==========================================

function formatCurrency(amount) {
    return `$${parseFloat(amount || 0).toFixed(2)}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
}

function getCurrentDate() {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

function generateCategoryOptions() {
    const incomeCategories = ['Salary', 'Business', 'Freelancing', 'Investment', 'Bonus', 'Other'];
    const expenseCategories = ['Food', 'Transport', 'Shopping', 'Education', 'Healthcare', 'Bills', 'Internet', 'Mobile', 'Rent', 'Entertainment', 'Travel', 'Other'];
    
    DOM.formCategory.innerHTML = '';
    const type = DOM.formType.value;
    const categories = type === 'income' ? incomeCategories : expenseCategories;
    
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        DOM.formCategory.appendChild(option);
    });
}

function showToast(message, type = 'info') {
    const icons = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    DOM.toastIcon.className = icons[type] || icons.info;
    DOM.toastMessage.textContent = message;
    DOM.toast.className = `fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 max-w-sm transform translate-y-0 opacity-100 transition-all duration-300 z-50 border border-gray-200 dark:border-gray-700 ${type}`;
    
    setTimeout(() => {
        DOM.toast.className = 'fixed bottom-4 right-4 bg-white dark:bg-gray-800 shadow-lg rounded-xl p-4 max-w-sm transform translate-y-full opacity-0 transition-all duration-300 z-50 border border-gray-200 dark:border-gray-700';
    }, 3000);
}

function showLoading(show) {
    DOM.loadingSpinner.classList.toggle('hidden', !show);
}

function showConfirmation(message, callback) {
    DOM.confirmMessage.textContent = message;
    DOM.confirmDialog.classList.remove('hidden');
    
    DOM.confirmYesBtn.onclick = () => {
        DOM.confirmDialog.classList.add('hidden');
        callback();
    };
    
    DOM.confirmNoBtn.onclick = () => {
        DOM.confirmDialog.classList.add('hidden');
    };
}

// ==========================================
// Theme Management
// ==========================================

function initTheme() {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark-mode');
        document.documentElement.classList.add('dark');
    } else {
        document.body.classList.remove('dark-mode');
        document.documentElement.classList.remove('dark');
    }
}

function toggleTheme() {
    const isDark = document.body.classList.contains('dark-mode');
    if (isDark) {
        document.body.classList.remove('dark-mode');
        document.documentElement.classList.remove('dark');
        localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    } else {
        document.body.classList.add('dark-mode');
        document.documentElement.classList.add('dark');
        localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    }
}

// ==========================================
// API Functions
// ==========================================

async function fetchTransactions() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/transactions`);
        if (!response.ok) throw new Error('Failed to fetch transactions');
        transactions = await response.json();
        return transactions;
    } catch (error) {
        console.error('Error fetching transactions:', error);
        showToast('Failed to load transactions', 'error');
        return [];
    } finally {
        showLoading(false);
    }
}

async function addTransaction(data) {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to add transaction');
        }
        
        const newTransaction = await response.json();
        transactions.push(newTransaction);
        showToast('Transaction added successfully!', 'success');
        return newTransaction;
    } catch (error) {
        console.error('Error adding transaction:', error);
        showToast(error.message || 'Failed to add transaction', 'error');
        throw error;
    } finally {
        showLoading(false);
    }
}

async function updateTransaction(id, data) {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update transaction');
        }
        
        const updated = await response.json();
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = updated;
        }
        showToast('Transaction updated successfully!', 'success');
        return updated;
    } catch (error) {
        console.error('Error updating transaction:', error);
        showToast(error.message || 'Failed to update transaction', 'error');
        throw error;
    } finally {
        showLoading(false);
    }
}

async function deleteTransaction(id) {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete transaction');
        }
        
        transactions = transactions.filter(t => t.id !== id);
        showToast('Transaction deleted successfully!', 'success');
        return true;
    } catch (error) {
        console.error('Error deleting transaction:', error);
        showToast(error.message || 'Failed to delete transaction', 'error');
        throw error;
    } finally {
        showLoading(false);
    }
}

// ==========================================
// Dashboard Calculations
// ==========================================

function calculateDashboard() {
    const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalExpense = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const balance = totalIncome - totalExpense;
    const savings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((savings / totalIncome) * 100) : 0;
    
    // Financial Health Score (0-100)
    let healthScore = 0;
    if (totalIncome > 0) {
        const expenseRatio = totalExpense / totalIncome;
        if (expenseRatio <= 0.5) healthScore = 100;
        else if (expenseRatio <= 0.7) healthScore = 80;
        else if (expenseRatio <= 0.85) healthScore = 60;
        else if (expenseRatio <= 0.95) healthScore = 40;
        else healthScore = 20;
    }
    
    // Budget (using 30% of income as budget)
    const monthlyBudget = totalIncome * 0.3;
    const budgetUsed = Math.min(totalExpense, monthlyBudget);
    const budgetRemaining = Math.max(0, monthlyBudget - totalExpense);
    const budgetProgress = monthlyBudget > 0 ? (budgetUsed / monthlyBudget) * 100 : 0;
    
    return {
        totalIncome,
        totalExpense,
        balance,
        savings,
        savingsRate,
        healthScore,
        monthlyBudget,
        budgetUsed,
        budgetRemaining,
        budgetProgress,
        transactionCount: transactions.length
    };
}

function updateDashboard() {
    const stats = calculateDashboard();
    
    DOM.balanceDisplay.textContent = formatCurrency(stats.balance);
    DOM.incomeDisplay.textContent = formatCurrency(stats.totalIncome);
    DOM.expenseDisplay.textContent = formatCurrency(stats.totalExpense);
    DOM.savingsDisplay.textContent = formatCurrency(stats.savings);
    DOM.savingsRateDisplay.textContent = `${Math.round(stats.savingsRate)}%`;
    DOM.healthScoreDisplay.textContent = Math.round(stats.healthScore);
    DOM.budgetRemainingDisplay.textContent = `${formatCurrency(stats.budgetRemaining)} remaining`;
    DOM.budgetProgressBar.style.width = `${Math.min(100, stats.budgetProgress)}%`;
    
    // Color the progress bar based on usage
    if (stats.budgetProgress > 100) {
        DOM.budgetProgressBar.classList.add('bg-red-600');
        DOM.budgetProgressBar.classList.remove('bg-blue-600');
    } else if (stats.budgetProgress > 80) {
        DOM.budgetProgressBar.classList.add('bg-yellow-600');
        DOM.budgetProgressBar.classList.remove('bg-blue-600');
    } else {
        DOM.budgetProgressBar.classList.add('bg-blue-600');
        DOM.budgetProgressBar.classList.remove('bg-red-600', 'bg-yellow-600');
    }
    
    // Update reports
    if (DOM.reportIncome) {
        DOM.reportIncome.textContent = formatCurrency(stats.totalIncome);
        DOM.reportExpense.textContent = formatCurrency(stats.totalExpense);
        DOM.reportSavings.textContent = formatCurrency(stats.savings);
        DOM.reportCount.textContent = stats.transactionCount;
    }
    
    // Update insights
    updateInsights(stats);
    updateEmergencyFund(stats);
    updateAdvice(stats);
    updateCharts();
}

// ==========================================
// Insights & Analysis
// ==========================================

function updateInsights(stats) {
    if (!DOM.insightsContainer) return;
    
    const insights = [];
    
    if (transactions.length === 0) {
        DOM.insightsContainer.innerHTML = '<p class="text-gray-600 dark:text-gray-400">Add transactions to see detailed financial insights.</p>';
        return;
    }
    
    // Average daily spending
    if (transactions.length > 0) {
        const firstDate = new Date(Math.min(...transactions.map(t => new Date(t.date).getTime())));
        const lastDate = new Date();
        const days = Math.max(1, Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)));
        const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const avgDaily = totalExpense / days;
        insights.push(`Average daily spending: ${formatCurrency(avgDaily)}`);
    }
    
    // Highest expense category
    const expenseByCategory = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amount;
    });
    if (Object.keys(expenseByCategory).length > 0) {
        const highest = Object.entries(expenseByCategory).reduce((a, b) => a[1] > b[1] ? a : b);
        insights.push(`Highest expense category: ${highest[0]} (${formatCurrency(highest[1])})`);
    }
    
    // Highest income source
    const incomeByCategory = {};
    transactions.filter(t => t.type === 'income').forEach(t => {
        incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
    });
    if (Object.keys(incomeByCategory).length > 0) {
        const highest = Object.entries(incomeByCategory).reduce((a, b) => a[1] > b[1] ? a : b);
        insights.push(`Highest income source: ${highest[0]} (${formatCurrency(highest[1])})`);
    }
    
    // Largest transaction
    if (transactions.length > 0) {
        const largest = transactions.reduce((a, b) => a.amount > b.amount ? a : b);
        insights.push(`Largest transaction: ${largest.title} (${formatCurrency(largest.amount)})`);
    }
    
    // Smallest transaction
    if (transactions.length > 0) {
        const smallest = transactions.reduce((a, b) => a.amount < b.amount ? a : b);
        insights.push(`Smallest transaction: ${smallest.title} (${formatCurrency(smallest.amount)})`);
    }
    
    // Average transaction
    if (transactions.length > 0) {
        const avg = transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length;
        insights.push(`Average transaction: ${formatCurrency(avg)}`);
    }
    
    DOM.insightsContainer.innerHTML = insights.map(insight => 
        `<p class="text-gray-700 dark:text-gray-300 flex items-start">
            <i class="fas fa-chevron-right text-blue-500 mt-1 mr-2 text-sm"></i>
            ${insight}
        </p>`
    ).join('');
}

function updateEmergencyFund(stats) {
    if (!DOM.emergencyFundContainer) return;
    
    const monthlyExpense = stats.totalExpense / Math.max(1, Math.ceil((new Date() - new Date(Math.min(...transactions.map(t => new Date(t.date).getTime())))) / (1000 * 60 * 60 * 24 * 30)));
    const recommendedEmergencyFund = monthlyExpense * 6; // 6 months of expenses
    const currentEmergencyFund = stats.savings;
    const coverage = monthlyExpense > 0 ? (currentEmergencyFund / monthlyExpense) : 0;
    const remainingNeeded = Math.max(0, recommendedEmergencyFund - currentEmergencyFund);
    
    const html = `
        <div class="space-y-3">
            <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Current Coverage</span>
                <span class="font-semibold dark:text-white">${coverage.toFixed(1)} months</span>
            </div>
            <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Recommended Coverage</span>
                <span class="font-semibold dark:text-white">6 months</span>
            </div>
            <div class="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
                <span class="text-gray-600 dark:text-gray-400">Remaining Needed</span>
                <span class="font-bold text-blue-600 dark:text-blue-400">${formatCurrency(remainingNeeded)}</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mt-2">
                <div class="bg-green-600 h-3 rounded-full" style="width: ${Math.min(100, (coverage / 6) * 100)}%"></div>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                ${coverage >= 6 ? '✅ You have a healthy emergency fund!' : `⚠️ You need ${formatCurrency(remainingNeeded)} more to reach 6 months of expenses.`}
            </p>
        </div>
    `;
    
    DOM.emergencyFundContainer.innerHTML = html;
}

// ==========================================
// Smart Advice
// ==========================================

function updateAdvice(stats) {
    if (!DOM.adviceContainer) return;
    
    const advice = [];
    
    if (transactions.length === 0) {
        DOM.adviceContainer.innerHTML = '<p class="text-gray-700 dark:text-gray-300">Add some transactions to receive personalized financial advice.</p>';
        return;
    }
    
    // Spending analysis
    const expenseRatio = stats.totalExpense / (stats.totalIncome || 1);
    if (expenseRatio > 0.9) {
        advice.push('⚠️ Your expenses are consuming most of your income. Consider reducing unnecessary spending.');
    } else if (expenseRatio > 0.7) {
        advice.push('📊 Your expense ratio is moderate. Look for small areas to optimize your spending.');
    } else if (expenseRatio < 0.5) {
        advice.push('🌟 Excellent! You\'re saving more than 50% of your income. Keep up the great work!');
    }
    
    // Budget advice
    if (stats.budgetProgress > 100) {
        advice.push('⚠️ You\'ve exceeded your monthly budget. Review your expenses and cut back where possible.');
    } else if (stats.budgetProgress > 80) {
        advice.push('📊 Your budget is almost used up. Be mindful of your remaining spending for this month.');
    } else if (stats.budgetProgress < 50 && stats.totalIncome > 0) {
        advice.push('✅ You\'re on track with your budget! Keep maintaining this healthy spending pattern.');
    }
    
    // Savings advice
    if (stats.savingsRate > 30) {
        advice.push('🏆 Outstanding savings rate! Consider investing your savings for long-term growth.');
    } else if (stats.savingsRate > 15) {
        advice.push('📈 Good savings rate. Aim to increase it to 30% for better financial security.');
    } else if (stats.savingsRate < 10 && stats.totalIncome > 0) {
        advice.push('💡 Try to save at least 10% of your income. Start small and increase gradually.');
    }
    
    // Emergency fund advice
    const monthlyExpense = stats.totalExpense / Math.max(1, Math.ceil((new Date() - new Date(Math.min(...transactions.map(t => new Date(t.date).getTime())))) / (1000 * 60 * 60 * 24 * 30)));
    const coverage = monthlyExpense > 0 ? (stats.savings / monthlyExpense) : 0;
    if (coverage < 3) {
        advice.push('🚨 Your emergency fund covers less than 3 months. Prioritize building this safety net.');
    } else if (coverage < 6) {
        advice.push('💪 You have some emergency savings. Aim for 6 months of expenses for full coverage.');
    }
    
    // Expense reduction suggestions
    const expenseCategories = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        expenseCategories[t.category] = (expenseCategories[t.category] || 0) + t.amount;
    });
    const sortedCategories = Object.entries(expenseCategories).sort((a, b) => b[1] - a[1]);
    if (sortedCategories.length > 0) {
        const topCategory = sortedCategories[0];
        advice.push(`💰 Your top expense is ${topCategory[0]} (${formatCurrency(topCategory[1])}). Consider ways to reduce this.`);
    }
    
    // Personalized financial tips
    if (transactions.some(t => t.type === 'income')) {
        advice.push('💡 Track every expense, no matter how small. Awareness is the first step to better finances.');
    }
    
    DOM.adviceContainer.innerHTML = advice.map(adv => 
        `<p class="text-gray-700 dark:text-gray-300 flex items-start">
            <i class="fas fa-chevron-right text-yellow-500 mt-1 mr-2 text-sm"></i>
            ${adv}
        </p>`
    ).join('');
}

// ==========================================
// Transactions Rendering
// ==========================================

function renderTransactions() {
    const searchTerm = DOM.searchInput.value.toLowerCase();
    const typeFilter = DOM.typeFilter.value;
    const categoryFilter = DOM.categoryFilter.value;
    const sortFilter = DOM.sortFilter.value;
    
    let filtered = [...transactions];
    
    // Search
    if (searchTerm) {
        filtered = filtered.filter(t => 
            t.title.toLowerCase().includes(searchTerm) ||
            (t.notes && t.notes.toLowerCase().includes(searchTerm))
        );
    }
    
    // Type filter
    if (typeFilter !== 'all') {
        filtered = filtered.filter(t => t.type === typeFilter);
    }
    
    // Category filter
    if (categoryFilter !== 'all') {
        filtered = filtered.filter(t => t.category === categoryFilter);
    }
    
    // Sort
    switch (sortFilter) {
        case 'newest':
            filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'oldest':
            filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
            break;
        case 'highest':
            filtered.sort((a, b) => b.amount - a.amount);
            break;
        case 'lowest':
            filtered.sort((a, b) => a.amount - b.amount);
            break;
    }
    
    // Render
    if (filtered.length === 0) {
        DOM.transactionsBody.innerHTML = '';
        DOM.emptyTransactions.classList.remove('hidden');
        return;
    }
    
    DOM.emptyTransactions.classList.add('hidden');
    
    DOM.transactionsBody.innerHTML = filtered.map(transaction => `
        <tr class="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <td class="py-3 px-4">
                <div class="font-medium dark:text-white">${transaction.title}</div>
                ${transaction.notes ? `<div class="text-xs text-gray-500 dark:text-gray-400">${transaction.notes}</div>` : ''}
            </td>
            <td class="py-3 px-4 hidden sm:table-cell">
                <span class="category-badge ${transaction.type}">${transaction.category}</span>
            </td>
            <td class="py-3 px-4 hidden md:table-cell text-gray-600 dark:text-gray-400">
                ${formatDate(transaction.date)}
            </td>
            <td class="py-3 px-4 text-right font-semibold ${transaction.type === 'income' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}">
                ${transaction.type === 'income' ? '+' : '-'}${formatCurrency(transaction.amount)}
            </td>
            <td class="py-3 px-4 text-center">
                <button class="action-btn edit-btn" onclick="editTransaction(${transaction.id})" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="confirmDelete(${transaction.id})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ==========================================
// Charts
// ==========================================

function updateCharts() {
    // Expense by Category - Pie Chart
    const expenseData = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        expenseData[t.category] = (expenseData[t.category] || 0) + t.amount;
    });
    
    const expenseLabels = Object.keys(expenseData);
    const expenseValues = Object.values(expenseData);
    
    const pieCtx = document.getElementById('expensePieChart');
    if (pieCtx) {
        if (charts.expensePie) {
            charts.expensePie.destroy();
        }
        
        if (expenseLabels.length > 0) {
            const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#14b8a6', '#f97316', '#8b5cf6'];
            charts.expensePie = new Chart(pieCtx, {
                type: 'pie',
                data: {
                    labels: expenseLabels,
                    datasets: [{
                        data: expenseValues,
                        backgroundColor: colors.slice(0, expenseLabels.length),
                        borderWidth: 2,
                        borderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: document.body.classList.contains('dark-mode') ? '#f3f4f6' : '#1a202c'
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Income vs Expense - Bar Chart
    const monthlyData = {};
    transactions.forEach(t => {
        const month = new Date(t.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (!monthlyData[month]) {
            monthlyData[month] = { income: 0, expense: 0 };
        }
        monthlyData[month][t.type] += t.amount;
    });
    
    const months = Object.keys(monthlyData);
    const incomeValues = months.map(m => monthlyData[m].income);
    const expenseValuesBar = months.map(m => monthlyData[m].expense);
    
    const barCtx = document.getElementById('incomeExpenseBarChart');
    if (barCtx) {
        if (charts.incomeExpenseBar) {
            charts.incomeExpenseBar.destroy();
        }
        
        if (months.length > 0) {
            charts.incomeExpenseBar = new Chart(barCtx, {
                type: 'bar',
                data: {
                    labels: months,
                    datasets: [
                        {
                            label: 'Income',
                            data: incomeValues,
                            backgroundColor: '#10b981',
                            borderColor: '#059669',
                            borderWidth: 2
                        },
                        {
                            label: 'Expense',
                            data: expenseValuesBar,
                            backgroundColor: '#ef4444',
                            borderColor: '#dc2626',
                            borderWidth: 2
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        legend: {
                            position: 'top',
                            labels: {
                                color: document.body.classList.contains('dark-mode') ? '#f3f4f6' : '#1a202c'
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: document.body.classList.contains('dark-mode') ? '#9ca3af' : '#6b7280'
                            }
                        },
                        x: {
                            ticks: {
                                color: document.body.classList.contains('dark-mode') ? '#9ca3af' : '#6b7280'
                            }
                        }
                    }
                }
            });
        }
    }
}

// ==========================================
// CRUD Operations
// ==========================================

function openAddModal() {
    DOM.modalTitle.textContent = 'Add Transaction';
    DOM.transactionForm.reset();
    DOM.transactionId.value = '';
    DOM.formDate.value = getCurrentDate();
    generateCategoryOptions();
    DOM.transactionModal.classList.remove('hidden');
    DOM.formTitle.focus();
}

function openEditModal(id) {
    const transaction = transactions.find(t => t.id === id);
    if (!transaction) return;
    
    DOM.modalTitle.textContent = 'Edit Transaction';
    DOM.transactionId.value = transaction.id;
    DOM.formTitle.value = transaction.title;
    DOM.formAmount.value = transaction.amount;
    DOM.formDate.value = transaction.date;
    DOM.formType.value = transaction.type;
    generateCategoryOptions();
    DOM.formCategory.value = transaction.category;
    DOM.formNotes.value = transaction.notes || '';
    DOM.transactionModal.classList.remove('hidden');
    DOM.formTitle.focus();
}

function editTransaction(id) {
    openEditModal(id);
}

function confirmDelete(id) {
    deleteTargetId = id;
    showConfirmation('Are you sure you want to delete this transaction?', async () => {
        try {
            await deleteTransaction(deleteTargetId);
            await refreshData();
        } catch (error) {
            console.error('Delete error:', error);
        } finally {
            deleteTargetId = null;
        }
    });
}

// ==========================================
// Form Handlers
// ==========================================

async function handleTransactionSubmit(e) {
    e.preventDefault();
    
    const id = DOM.transactionId.value;
    const data = {
        title: DOM.formTitle.value.trim(),
        amount: parseFloat(DOM.formAmount.value),
        date: DOM.formDate.value,
        type: DOM.formType.value,
        category: DOM.formCategory.value,
        notes: DOM.formNotes.value.trim()
    };
    
    // Validation
    if (!data.title) {
        showToast('Please enter a title', 'error');
        return;
    }
    
    if (!data.amount || data.amount <= 0) {
        showToast('Please enter a valid amount greater than 0', 'error');
        return;
    }
    
    if (!data.date) {
        showToast('Please select a date', 'error');
        return;
    }
    
    try {
        if (id) {
            await updateTransaction(parseInt(id), data);
        } else {
            await addTransaction(data);
        }
        DOM.transactionModal.classList.add('hidden');
        await refreshData();
    } catch (error) {
        console.error('Save error:', error);
    }
}

// ==========================================
// Reports
// ==========================================

function printReport() {
    window.print();
}

function exportJSON() {
    if (transactions.length === 0) {
        showToast('No transactions to export', 'warning');
        return;
    }
    
    const dataStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Transactions exported successfully!', 'success');
}

function importJSON(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = JSON.parse(e.target.result);
            if (!Array.isArray(data)) {
                throw new Error('Invalid JSON format');
            }
            
            showConfirmation(`This will import ${data.length} transactions. Continue?`, async () => {
                let successCount = 0;
                for (const transaction of data) {
                    try {
                        await addTransaction(transaction);
                        successCount++;
                    } catch (error) {
                        console.error('Failed to import transaction:', transaction, error);
                    }
                }
                await refreshData();
                showToast(`Imported ${successCount} transactions successfully!`, 'success');
            });
        } catch (error) {
            console.error('Import error:', error);
            showToast('Failed to import JSON file. Please check the format.', 'error');
        }
    };
    reader.readAsText(file);
}

// ==========================================
// Data Refresh
// ==========================================

async function refreshData() {
    await fetchTransactions();
    updateDashboard();
    renderTransactions();
    updateCategoryFilter();
}

// ==========================================
// Category Filter Update
// ==========================================

function updateCategoryFilter() {
    const categories = new Set();
    transactions.forEach(t => categories.add(t.category));
    
    const currentValue = DOM.categoryFilter.value;
    DOM.categoryFilter.innerHTML = '<option value="all">All Categories</option>';
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        DOM.categoryFilter.appendChild(option);
    });
    DOM.categoryFilter.value = currentValue;
}

// ==========================================
// Navigation
// ==========================================

function navigateTo(sectionId) {
    // Hide all sections
    Object.values(DOM.sections).forEach(section => {
        if (section) section.classList.add('hidden');
    });
    
    // Show target section
    const target = document.querySelector(`#${sectionId}`);
    if (target) {
        target.classList.remove('hidden');
    }
    
    // Update nav links
    DOM.navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
    
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
        closeSidebar();
    }
    
    // Scroll to top of section
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// ==========================================
// Sidebar
// ==========================================

function openSidebar() {
    DOM.sidebar.classList.add('open');
    DOM.mobileOverlay.classList.add('show');
    DOM.mobileOverlay.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    DOM.sidebar.classList.remove('open');
    DOM.mobileOverlay.classList.remove('show');
    DOM.mobileOverlay.style.display = 'none';
    document.body.style.overflow = '';
}

// ==========================================
// Event Listeners
// ==========================================

function initEventListeners() {
    // Theme toggle
    DOM.themeToggle.addEventListener('click', toggleTheme);
    
    // Sidebar
    DOM.openSidebar.addEventListener('click', openSidebar);
    DOM.closeSidebar.addEventListener('click', closeSidebar);
    DOM.mobileOverlay.addEventListener('click', closeSidebar);
    
    // Navigation
    DOM.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const href = link.getAttribute('href');
            if (href) {
                navigateTo(href.substring(1));
            }
        });
    });
    
    // Add transaction
    DOM.addTransactionBtn.addEventListener('click', openAddModal);
    
    // Modal controls
    DOM.closeModal.addEventListener('click', () => {
        DOM.transactionModal.classList.add('hidden');
    });
    DOM.cancelModalBtn.addEventListener('click', () => {
        DOM.transactionModal.classList.add('hidden');
    });
    DOM.transactionModal.addEventListener('click', (e) => {
        if (e.target === DOM.transactionModal) {
            DOM.transactionModal.classList.add('hidden');
        }
    });
    
    // Form submission
    DOM.transactionForm.addEventListener('submit', handleTransactionSubmit);
    
    // Type change updates categories
    DOM.formType.addEventListener('change', generateCategoryOptions);
    
    // Search and filters
    DOM.searchInput.addEventListener('input', renderTransactions);
    DOM.typeFilter.addEventListener('change', renderTransactions);
    DOM.categoryFilter.addEventListener('change', renderTransactions);
    DOM.sortFilter.addEventListener('change', renderTransactions);
    
    // Reports
    DOM.printReportBtn.addEventListener('click', printReport);
    DOM.exportJsonBtn.addEventListener('click', exportJSON);
    DOM.importJsonBtn.addEventListener('click', () => {
        DOM.jsonFileInput.click();
    });
    DOM.jsonFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importJSON(e.target.files[0]);
        }
        e.target.value = '';
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape closes modal/dialog
        if (e.key === 'Escape') {
            if (!DOM.transactionModal.classList.contains('hidden')) {
                DOM.transactionModal.classList.add('hidden');
            }
            if (!DOM.confirmDialog.classList.contains('hidden')) {
                DOM.confirmDialog.classList.add('hidden');
            }
        }
        // Ctrl+N opens add transaction
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            openAddModal();
        }
    });
}

// ==========================================
// Date Display
// ==========================================

function updateDateDisplay() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    DOM.currentDate.textContent = now.toLocaleDateString('en-US', options);
}

// ==========================================
// Auto-refresh
// ==========================================

// Set up auto-refresh every 5 minutes
let autoRefreshInterval = null;

function startAutoRefresh() {
    if (autoRefreshInterval) clearInterval(autoRefreshInterval);
    autoRefreshInterval = setInterval(refreshData, 300000); // 5 minutes
}

// ==========================================
// Initialization
// ==========================================

async function init() {
    // Initialize DOM references
    initDOMReferences();
    
    // Initialize theme
    initTheme();
    
    // Set current date
    updateDateDisplay();
    updateDateDisplay();
    setInterval(updateDateDisplay, 60000); // Update every minute
    
    // Initialize form date
    DOM.formDate.value = getCurrentDate();
    
    // Set default category options
    generateCategoryOptions();
    
    // Load data
    await refreshData();
    
    // Initialize event listeners
    initEventListeners();
    
    // Start auto-refresh
    startAutoRefresh();
    
    // Show welcome toast
    if (transactions.length === 0) {
        setTimeout(() => {
            showToast('Welcome to Smart Expense Tracker! Add your first transaction.', 'info');
        }, 500);
    }
    
    console.log('Smart Expense Tracker initialized successfully!');
    console.log('All rights reserved by Md. Ashikur Rahman (1244050)');
}

// Initialize the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// ==========================================
// Handle Window Resize
// ==========================================

let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // Refresh charts on resize
        updateCharts();
    }, 250);
});

// ==========================================
// Cleanup on Page Unload
// ==========================================

window.addEventListener('beforeunload', () => {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
});