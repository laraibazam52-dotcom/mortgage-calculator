// Mortgage Calculator Application
document.addEventListener('DOMContentLoaded', function() {
    // Set current year in footer
    document.getElementById('currentYear').textContent = new Date().getFullYear();
    
    // Initialize the calculator
    initCalculator();
    
    // Initialize the accordion
    initAccordion();
});

// Main Calculator Initialization
function initCalculator() {
    // Get DOM elements
    const loanAmountSlider = document.getElementById('loanAmount');
    const interestRateSlider = document.getElementById('interestRate');
    const loanTermSlider = document.getElementById('loanTerm');
    const calculateBtn = document.getElementById('calculateBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    const loanAmountValue = document.getElementById('loanAmountValue');
    const interestRateValue = document.getElementById('interestRateValue');
    const loanTermValue = document.getElementById('loanTermValue');
    
    const monthlyPaymentEl = document.getElementById('monthlyPayment');
    const totalInterestEl = document.getElementById('totalInterest');
    const totalPaymentEl = document.getElementById('totalPayment');
    
    // Amortization table elements
    const amortizationBody = document.getElementById('amortizationBody');
    const entriesPerPageSelect = document.getElementById('entriesPerPage');
    const searchTableInput = document.getElementById('searchTable');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const pageNumbersContainer = document.getElementById('pageNumbers');
    const paginationInfo = document.getElementById('paginationInfo');
    
    // Sorting elements
    const sortYear = document.getElementById('sortYear');
    const sortPrincipal = document.getElementById('sortPrincipal');
    const sortInterest = document.getElementById('sortInterest');
    const sortBalance = document.getElementById('sortBalance');
    const sortCumulative = document.getElementById('sortCumulative');
    
    // Chart elements
    let paymentChart = null;
    
    // Initialize slider values display
    updateSliderValues();
    
    // Set up event listeners for sliders
    loanAmountSlider.addEventListener('input', function() {
        updateSliderValues();
        // Optional: Auto-calculate on slider change
        // calculateMortgage();
    });
    
    interestRateSlider.addEventListener('input', function() {
        updateSliderValues();
    });
    
    loanTermSlider.addEventListener('input', function() {
        updateSliderValues();
    });
    
    // Calculate button
    calculateBtn.addEventListener('click', function() {
        calculateBtn.classList.add('fade-in');
        setTimeout(() => calculateBtn.classList.remove('fade-in'), 500);
        calculateMortgage();
    });
    
    // Reset button
    resetBtn.addEventListener('click', function() {
        resetCalculator();
    });
    
    // Table controls
    entriesPerPageSelect.addEventListener('change', function() {
        currentPage = 1;
        renderAmortizationTable();
    });
    
    searchTableInput.addEventListener('input', function() {
        currentPage = 1;
        renderAmortizationTable();
    });
    
    prevPageBtn.addEventListener('click', function() {
        if (currentPage > 1) {
            currentPage--;
            renderAmortizationTable();
        }
    });
    
    nextPageBtn.addEventListener('click', function() {
        if (currentPage < totalPages) {
            currentPage++;
            renderAmortizationTable();
        }
    });
    
    // Sorting functionality
    let sortColumn = 'year';
    let sortDirection = 'asc';
    
    [sortYear, sortPrincipal, sortInterest, sortBalance, sortCumulative].forEach((element, index) => {
        element.addEventListener('click', function() {
            const columns = ['year', 'principal', 'interest', 'balance', 'cumulative'];
            const column = columns[index];
            
            if (sortColumn === column) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortColumn = column;
                sortDirection = 'asc';
            }
            
            // Update sort indicators
            updateSortIndicators();
            
            // Re-render table with sorted data
            renderAmortizationTable();
        });
    });
    
    // Calculator state
    let amortizationData = [];
    let filteredData = [];
    let currentPage = 1;
    let entriesPerPage = 10;
    let totalPages = 1;
    
    // Update slider value displays
    function updateSliderValues() {
        const loanAmount = parseFloat(loanAmountSlider.value);
        const interestRate = parseFloat(interestRateSlider.value);
        const loanTerm = parseFloat(loanTermSlider.value);
        
        // Format and display values
        loanAmountValue.textContent = formatCurrency(loanAmount);
        interestRateValue.textContent = interestRate.toFixed(1) + '%';
        loanTermValue.textContent = loanTerm + ' year' + (loanTerm !== 1 ? 's' : '');
    }
    
    // Format currency
    function formatCurrency(amount) {
        return '$' + amount.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
    }
    
    // Format number with commas
    function formatNumber(num) {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    // Calculate mortgage
    function calculateMortgage() {
        const loanAmount = parseFloat(loanAmountSlider.value);
        const annualInterestRate = parseFloat(interestRateSlider.value);
        const loanTermYears = parseFloat(loanTermSlider.value);
        
        // Calculate monthly interest rate
        const monthlyInterestRate = annualInterestRate / 100 / 12;
        const numberOfPayments = loanTermYears * 12;
        
        // Calculate monthly payment using the formula
        // M = P * (r(1+r)^n) / ((1+r)^n - 1)
        const monthlyPayment = loanAmount * 
            (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numberOfPayments)) / 
            (Math.pow(1 + monthlyInterestRate, numberOfPayments) - 1);
        
        // Calculate total payment and interest
        const totalPayment = monthlyPayment * numberOfPayments;
        const totalInterest = totalPayment - loanAmount;
        
        // Generate amortization schedule
        generateAmortizationSchedule(loanAmount, annualInterestRate, loanTermYears, monthlyPayment);
        
        // Update results display
        monthlyPaymentEl.textContent = formatCurrency(monthlyPayment);
        totalInterestEl.textContent = formatCurrency(totalInterest);
        totalPaymentEl.textContent = formatCurrency(totalPayment);
        
        // Update chart
        updateChart(loanAmount, totalInterest);
        
        // Render amortization table
        renderAmortizationTable();
    }
    
    // Generate amortization schedule
    function generateAmortizationSchedule(loanAmount, annualInterestRate, loanTermYears, monthlyPayment) {
        amortizationData = [];
        let remainingBalance = loanAmount;
        const monthlyRate = annualInterestRate / 100 / 12;
        const totalMonths = loanTermYears * 12;
        let cumulativeInterest = 0;
        
        for (let year = 1; year <= loanTermYears; year++) {
            let yearPrincipal = 0;
            let yearInterest = 0;
            
            // Calculate for each month in the year
            for (let month = 1; month <= 12; month++) {
                if (remainingBalance <= 0) break;
                
                const interestPayment = remainingBalance * monthlyRate;
                const principalPayment = monthlyPayment - interestPayment;
                
                yearPrincipal += principalPayment;
                yearInterest += interestPayment;
                cumulativeInterest += interestPayment;
                
                remainingBalance -= principalPayment;
                
                // Handle final payment adjustment
                if (remainingBalance < 0) {
                    yearPrincipal += remainingBalance;
                    remainingBalance = 0;
                }
            }
            
            amortizationData.push({
                year: year,
                principal: yearPrincipal,
                interest: yearInterest,
                balance: remainingBalance,
                cumulative: cumulativeInterest
            });
            
            if (remainingBalance <= 0) break;
        }
        
        // Sort data based on current sort settings
        sortAmortizationData();
    }
    
    // Sort amortization data
    function sortAmortizationData() {
        amortizationData.sort((a, b) => {
            let aValue, bValue;
            
            switch(sortColumn) {
                case 'year':
                    aValue = a.year;
                    bValue = b.year;
                    break;
                case 'principal':
                    aValue = a.principal;
                    bValue = b.principal;
                    break;
                case 'interest':
                    aValue = a.interest;
                    bValue = b.interest;
                    break;
                case 'balance':
                    aValue = a.balance;
                    bValue = b.balance;
                    break;
                case 'cumulative':
                    aValue = a.cumulative;
                    bValue = b.cumulative;
                    break;
                default:
                    aValue = a.year;
                    bValue = b.year;
            }
            
            if (sortDirection === 'asc') {
                return aValue - bValue;
            } else {
                return bValue - aValue;
            }
        });
    }
    
    // Update sort indicators
    function updateSortIndicators() {
        // Reset all indicators
        [sortYear, sortPrincipal, sortInterest, sortBalance, sortCumulative].forEach(el => {
            el.className = 'fas fa-sort';
        });
        
        // Set active indicator
        let activeElement;
        switch(sortColumn) {
            case 'year': activeElement = sortYear; break;
            case 'principal': activeElement = sortPrincipal; break;
            case 'interest': activeElement = sortInterest; break;
            case 'balance': activeElement = sortBalance; break;
            case 'cumulative': activeElement = sortCumulative; break;
        }
        
        activeElement.className = sortDirection === 'asc' ? 'fas fa-sort-up' : 'fas fa-sort-down';
    }
    
    // Filter and paginate amortization data
    function renderAmortizationTable() {
        entriesPerPage = parseInt(entriesPerPageSelect.value);
        const searchTerm = searchTableInput.value.toLowerCase();
        
        // Filter data based on search term
        if (searchTerm) {
            filteredData = amortizationData.filter(item => 
                item.year.toString().includes(searchTerm) ||
                formatCurrency(item.principal).toLowerCase().includes(searchTerm) ||
                formatCurrency(item.interest).toLowerCase().includes(searchTerm)
            );
        } else {
            filteredData = [...amortizationData];
        }
        
        // Calculate pagination
        totalPages = Math.ceil(filteredData.length / entriesPerPage);
        if (totalPages === 0) totalPages = 1;
        
        // Ensure current page is valid
        if (currentPage > totalPages) currentPage = totalPages;
        if (currentPage < 1) currentPage = 1;
        
        // Get data for current page
        const startIndex = (currentPage - 1) * entriesPerPage;
        const endIndex = startIndex + entriesPerPage;
        const pageData = filteredData.slice(startIndex, endIndex);
        
        // Clear table body
        amortizationBody.innerHTML = '';
        
        // Populate table with data
        if (pageData.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="5" style="text-align: center; padding: 40px; color: #666;">
                    No data available. Try adjusting your search or calculate a mortgage first.
                </td>
            `;
            amortizationBody.appendChild(row);
        } else {
            pageData.forEach(item => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><strong>${item.year}</strong></td>
                    <td>${formatCurrency(item.principal)}</td>
                    <td>${formatCurrency(item.interest)}</td>
                    <td>${formatCurrency(item.balance)}</td>
                    <td>${formatCurrency(item.cumulative)}</td>
                `;
                amortizationBody.appendChild(row);
            });
        }
        
        // Update pagination info
        const startEntry = filteredData.length === 0 ? 0 : startIndex + 1;
        const endEntry = Math.min(startIndex + entriesPerPage, filteredData.length);
        paginationInfo.textContent = `Showing ${startEntry} to ${endEntry} of ${filteredData.length} entries`;
        
        // Update pagination controls
        updatePaginationControls();
        
        // Update button states
        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === totalPages;
    }
    
    // Update pagination controls
    function updatePaginationControls() {
        pageNumbersContainer.innerHTML = '';
        
        // Determine which page numbers to show
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        // Adjust if we're near the beginning
        if (endPage - startPage < 4 && startPage > 1) {
            startPage = Math.max(1, endPage - 4);
        }
        
        // Create page number buttons
        for (let i = startPage; i <= endPage; i++) {
            const pageButton = document.createElement('button');
            pageButton.className = `page-number ${i === currentPage ? 'active' : ''}`;
            pageButton.textContent = i;
            pageButton.addEventListener('click', function() {
                currentPage = i;
                renderAmortizationTable();
            });
            pageNumbersContainer.appendChild(pageButton);
        }
    }
    
    // Update chart
    function updateChart(principal, interest) {
        const ctx = document.getElementById('paymentChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (paymentChart) {
            paymentChart.destroy();
        }
        
        // Create new chart
        paymentChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Principal', 'Interest'],
                datasets: [{
                    data: [principal, interest],
                    backgroundColor: [
                        '#2c3e50',  // Principal color
                        '#3498db'   // Interest color
                    ],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '65%'
            }
        });
        
        // Update chart legend
        const chartLegend = document.getElementById('chartLegend');
        chartLegend.innerHTML = `
            <div class="legend-item">
                <div class="legend-color" style="background-color: #2c3e50;"></div>
                <span>Principal: ${formatCurrency(principal)}</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background-color: #3498db;"></div>
                <span>Interest: ${formatCurrency(interest)}</span>
            </div>
            <div class="legend-item">
                <div class="legend-color" style="background: linear-gradient(to right, #2c3e50, #3498db);"></div>
                <span><strong>Total: ${formatCurrency(principal + interest)}</strong></span>
            </div>
        `;
    }
    
    // Reset calculator
    function resetCalculator() {
        loanAmountSlider.value = 300000;
        interestRateSlider.value = 4.5;
        loanTermSlider.value = 30;
        
        updateSliderValues();
        
        monthlyPaymentEl.textContent = '$0.00';
        totalInterestEl.textContent = '$0.00';
        totalPaymentEl.textContent = '$0.00';
        
        amortizationData = [];
        currentPage = 1;
        renderAmortizationTable();
        
        // Reset chart
        if (paymentChart) {
            paymentChart.destroy();
            paymentChart = null;
        }
        
        document.getElementById('chartLegend').innerHTML = '';
        
        // Reset search and entries
        searchTableInput.value = '';
        entriesPerPageSelect.value = '10';
        
        // Reset sort
        sortColumn = 'year';
        sortDirection = 'asc';
        updateSortIndicators();
        
        // Add visual feedback
        resetBtn.classList.add('fade-in');
        setTimeout(() => resetBtn.classList.remove('fade-in'), 500);
    }
    
    // Initialize with a sample calculation
    calculateMortgage();
}

// Accordion functionality
function initAccordion() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const item = this.parentElement;
            const content = this.nextElementSibling;
            const isActive = item.classList.contains('active');
            
            // Close all accordion items
            document.querySelectorAll('.accordion-item').forEach(otherItem => {
                otherItem.classList.remove('active');
                otherItem.querySelector('.accordion-header').classList.remove('active');
                otherItem.querySelector('.accordion-content').classList.remove('open');
            });
            
            // Open this item if it wasn't active
            if (!isActive) {
                item.classList.add('active');
                this.classList.add('active');
                content.classList.add('open');
            }
        });
    });
    
    // Open first accordion item by default
    if (accordionHeaders.length > 0) {
        accordionHeaders[0].click();
    }
}
