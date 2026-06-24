const fs = require('fs');
const path = require('path');

const pages = [
  'Home', 'Catalog', 'LotDetailPage', 'FarmersList', 'FarmerProfilePage',
  'Cart', 'Checkout', 'Orders', 'OrderDetailPage', 'Profile', 'Login', 'Register'
];

const farmerPages = [
  'Dashboard', 'MyLots', 'MyOrders', 'MyReviews'
];

const createStub = (name, isFarmer) => {
  const dir = isFarmer ? 'src/pages/farmer' : 'src/pages';
  const filePath = path.join(__dirname, dir, `${name}.tsx`);
  const content = `import React from 'react';\n\nexport default function ${name}() {\n  return <div>${name}</div>;\n}\n`;
  fs.writeFileSync(filePath, content);
};

pages.forEach(p => createStub(p, false));
farmerPages.forEach(p => createStub(p, true));
