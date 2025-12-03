const fs = require('fs');
const path = require('path');

// Read demoData.json
const demoDataPath = path.join(__dirname, '..', 'public', 'data', 'demoData.json');
const demoData = JSON.parse(fs.readFileSync(demoDataPath, 'utf8'));

// Function to generate 12-month payment schedule
function generatePayments(amount, expiredMonth = 12) {
  const payments = [];
  const monthlyPayment = Math.round(amount / expiredMonth);
  let remainingDebt = amount;
  
  const startDate = new Date('2025-12-05');
  
  for (let i = 0; i < expiredMonth; i++) {
    const paymentDate = new Date(startDate);
    paymentDate.setMonth(startDate.getMonth() + i);
    
    const isLastPayment = i === expiredMonth - 1;
    const prAmount = isLastPayment ? remainingDebt : monthlyPayment;
    remainingDebt -= prAmount;
    
    payments.push({
      date: paymentDate.toISOString().split('T')[0],
      prAmount: prAmount,
      totalAmount: prAmount,
      remainingMainDebt: Math.max(0, remainingDebt)
    });
  }
  
  return payments;
}

// Add payments to first 15 applications (mix of statuses)
const appsToUpdate = [1, 2, 3, 5, 7, 10, 14, 15, 18, 20, 25, 30, 35, 40, 45];

appsToUpdate.forEach(appId => {
  const app = demoData.applications.find(a => a.id === appId);
  if (app && app.amount) {
    app.payments = generatePayments(app.amount, parseInt(app.expired_month) || 12);
    console.log(`✅ Added payments to application #${appId} (${app.amount} so'm, ${app.expired_month} oy)`);
  }
});

// Write back to file
fs.writeFileSync(demoDataPath, JSON.stringify(demoData, null, 2), 'utf8');

console.log('\n✅ Payments added successfully to demoData.json!');
console.log(`Total applications with payments: ${appsToUpdate.length}`);
