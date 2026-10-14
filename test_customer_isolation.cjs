// Verification script for customer data isolation and authorization
const http = require('http');

function request(options, bodyData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (bodyData) {
      req.write(typeof bodyData === 'string' ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('   INDIA2WORLD CUSTOMER DATA ISOLATION TEST SUITE   ');
  console.log('====================================================\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Unauthenticated Gate Test
  console.log('--- TEST 1: Unauthenticated API Access Protection ---');
  const unauthRes = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/customer/buy-for-me',
    method: 'GET'
  });
  assert(unauthRes.status === 401, `Unauthenticated /api/customer/buy-for-me returns 401 (Received: ${unauthRes.status})`);
  assert(unauthRes.body?.error?.includes('Unauthorized') || unauthRes.body?.error?.includes('Customer authentication required'), 'Response informs client of required customer authentication');

  // 2. Customer A (Riya) Login
  console.log('\n--- TEST 2: Customer A (Riya) Authentication & Retrieval ---');
  const loginARes = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/customer/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'pharmayushonline@gmail.com' });

  assert(loginARes.status === 200, `Riya login returned 200 (Received: ${loginARes.status})`);
  assert(loginARes.body?.success === true, 'Login response success is true');
  const tokenA = loginARes.body?.token;
  const userA = loginARes.body?.customer || loginARes.body?.user;
  assert(tokenA && tokenA.includes('tok_'), `Valid session token issued: ${tokenA?.slice(0, 15)}...`);
  assert(userA?.customerId === 'CUS-49006', `Correct Customer ID: ${userA?.customerId}`);
  assert(userA?.email === 'pharmayushonline@gmail.com', `Correct Email: ${userA?.email}`);

  // Fetch Customer A Workspace
  const workspaceARes = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/customer/buy-for-me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  assert(workspaceARes.status === 200, `Customer A workspace fetch returned 200`);
  const ordersA = workspaceARes.body?.orders || [];
  const reqsA = workspaceARes.body?.previousRequests || [];
  const hasOnlyAOrders = ordersA.every(o => o.customerId === 'CUS-49006' || o.customerEmail === 'pharmayushonline@gmail.com');
  const hasBOrdersInA = ordersA.some(o => o.customerId === 'CUS-31026' || o.customerEmail === 'pharmayushtechteam@gmail.com');
  assert(hasOnlyAOrders && !hasBOrdersInA, `Customer A sees only their orders (${ordersA.map(o => o.orderId || o.id).join(', ')}). Customer B orders excluded.`);
  const hasBReqsInA = reqsA.some(r => r.customerId === 'CUS-31026');
  assert(!hasBReqsInA, `Customer A does not see Customer B purchase requests.`);

  // 3. Customer B (Rohith) Login
  console.log('\n--- TEST 3: Customer B (Rohith) Authentication & Retrieval ---');
  const loginBRes = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/customer/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'pharmayushtechteam@gmail.com' });

  assert(loginBRes.status === 200, `Rohith login returned 200`);
  const tokenB = loginBRes.body?.token;
  const userB = loginBRes.body?.customer || loginBRes.body?.user;
  assert(userB?.customerId === 'CUS-31026', `Correct Customer B ID: ${userB?.customerId}`);

  // Fetch Customer B Workspace
  const workspaceBRes = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/customer/buy-for-me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  assert(workspaceBRes.status === 200, `Customer B workspace fetch returned 200`);
  const ordersB = workspaceBRes.body?.orders || [];
  const reqsB = workspaceBRes.body?.previousRequests || [];
  const hasOnlyBOrders = ordersB.every(o => o.customerId === 'CUS-31026' || o.customerEmail === 'pharmayushtechteam@gmail.com');
  const hasAOrdersInB = ordersB.some(o => o.customerId === 'CUS-49006' || o.customerEmail === 'pharmayushonline@gmail.com');
  assert(hasOnlyBOrders && !hasAOrdersInB, `Customer B sees only their orders (${ordersB.map(o => o.orderId || o.id).join(', ')}). Customer A orders excluded.`);
  const hasAReqsInB = reqsB.some(r => r.customerId === 'CUS-49006');
  assert(!hasAReqsInB, `Customer B does not see Customer A purchase requests.`);

  // 4. Cross-Customer ID Tampering and Security Check (HTTP 403 Forbidden)
  console.log('\n--- TEST 4: ID Tampering & Cross-Customer Unauthorized Access ---');
  // Customer B attempts to fetch Customer A's order ORD-22033
  const hijackRes = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/customer/orders/ORD-22033',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  assert(hijackRes.status === 403, `Customer B requesting Customer A order ORD-22033 is blocked with 403 Forbidden (Received: ${hijackRes.status})`);
  assert(hijackRes.body?.error?.includes('Forbidden') || hijackRes.body?.error?.includes('permission'), `Error response clearly communicates access denial: "${hijackRes.body?.error}"`);

  // Customer A accesses their own order ORD-22033
  const ownOrderRes = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/customer/orders/ORD-22033',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  assert(ownOrderRes.status === 200, `Customer A accessing their own order ORD-22033 succeeds with 200 OK`);
  const fetchedOrderId = ownOrderRes.body?.order?.orderId || ownOrderRes.body?.order?.id;
  assert(fetchedOrderId === 'ORD-22033', `Received order matches requested ID: ${fetchedOrderId}`);

  // 5. Customer-Isolated Drafts and Purchase Requests
  console.log('\n--- TEST 5: Isolated Draft Products and Requests ---');
  // Customer A adds a product to draft
  const newProduct = {
    id: 'prod_' + Date.now(),
    name: 'FabIndia Silk Kurta (Riya Exclusive)',
    priceINR: 3499,
    quantity: 1,
    size: 'M',
    colour: 'Deep Red',
    store: 'FabIndia',
    url: 'https://www.fabindia.com/sample-kurta',
    imageUrl: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80'
  };

  const addProductRes = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/customer/buy-for-me/products',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`
    }
  }, { product: newProduct });
  assert(addProductRes.status === 200, `Customer A added product to draft (Status: ${addProductRes.status})`);

  // Verify Customer A workspace has this product
  const checkDraftARes = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/customer/buy-for-me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  const draftA = checkDraftARes.body?.draftProducts || [];
  assert(draftA.some(p => p.id === newProduct.id), `Customer A sees the newly added draft product (${draftA.length} draft items)`);

  // Verify Customer B workspace DOES NOT have Customer A's product
  const checkDraftBRes = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/customer/buy-for-me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  const draftB = checkDraftBRes.body?.draftProducts || [];
  assert(!draftB.some(p => p.id === newProduct.id), `Customer B's draft is completely isolated and does not contain Customer A's product (${draftB.length} draft items)`);

  // Customer A clears their draft with new request
  const newReqRes = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/customer/buy-for-me/new-request',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  assert(newReqRes.status === 200, `Customer A + New Request cleared draft successfully`);

  const afterClearARes = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/customer/buy-for-me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  assert(afterClearARes.body?.draftProducts?.length === 0, `Customer A draft is now empty after starting new request`);

  // 6. Registration of a new customer
  console.log('\n--- TEST 6: New Customer Registration & Isolation ---');
  const randomEmail = `test_customer_${Date.now()}@example.com`;
  const signupRes = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/customer/auth/signup',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, {
    email: randomEmail,
    fullName: 'Ananya Verma',
    phone: '+91 99887 76655',
    country: 'United States',
    city: 'San Jose'
  });
  assert(signupRes.status === 200, `Signup returned 200 OK`);
  const newCusToken = signupRes.body?.token;
  const newCusUser = signupRes.body?.customer || signupRes.body?.user;
  assert(newCusUser?.customerId && newCusUser.customerId.startsWith('CUS-'), `Generated proper Customer ID: ${newCusUser?.customerId}`);
  assert(newCusUser?.lockerId && newCusUser.lockerId.startsWith('I2W-'), `Generated proper Locker ID: ${newCusUser?.lockerId}`);

  // New customer draft is clean
  const newCusWorkspace = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/customer/buy-for-me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${newCusToken}` }
  });
  assert(newCusWorkspace.body?.orders?.length === 0, `New customer has 0 orders initially`);
  assert(newCusWorkspace.body?.previousRequests?.length === 0, `New customer has 0 purchase requests initially`);

  // 7. Logout and Session Invalidation
  console.log('\n--- TEST 7: Logout & Session Revocation ---');
  const logoutRes = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/customer/auth/logout',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  assert(logoutRes.status === 200, `Customer A logout succeeded`);

  // Attempt to use revoked token
  const afterLogoutRes = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/customer/buy-for-me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  assert(afterLogoutRes.status === 401, `Revoked token is rejected with 401 Unauthorized (Received: ${afterLogoutRes.status})`);

  // 8. Specific Customer Test: Mithuna (CUS-24325, mithuna@example.com)
  console.log('\n--- TEST 8: Mithuna (mithuna@example.com) Strict Isolation ---');
  const loginMithuna = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/customer/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email: 'mithuna@example.com', fullName: 'mithuna' });
  assert(loginMithuna.status === 200, 'Mithuna login returned 200');
  const tokenMithuna = loginMithuna.body?.token;
  const userMithuna = loginMithuna.body?.customer || loginMithuna.body?.user;
  assert(userMithuna?.email === 'mithuna@example.com', `Mithuna email matches: ${userMithuna?.email}`);

  // Fetch Mithuna workspace
  const workspaceMithuna = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/customer/buy-for-me',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenMithuna}` }
  });
  assert(workspaceMithuna.status === 200, 'Mithuna workspace fetch returned 200');
  const ordersMithuna = workspaceMithuna.body?.orders || [];
  const reqsMithuna = workspaceMithuna.body?.previousRequests || [];
  // Ensure Riya's and Rohith's orders and requests are NOT in Mithuna's account
  assert(!ordersMithuna.some(o => o.customerId === 'CUS-49006' || o.customerEmail === 'pharmayushonline@gmail.com'), 'Mithuna DOES NOT see Riya orders');
  assert(!ordersMithuna.some(o => o.customerId === 'CUS-31026' || o.customerEmail === 'pharmayushtechteam@gmail.com'), 'Mithuna DOES NOT see Rohith orders');
  assert(!reqsMithuna.some(r => r.customerId === 'CUS-49006'), 'Mithuna DOES NOT see Riya requests');
  assert(!reqsMithuna.some(r => r.customerId === 'CUS-31026'), 'Mithuna DOES NOT see Rohith requests');

  // Verify Mithuna cannot access Riya's order ORD-22033
  const mithunaHijackA = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/customer/orders/ORD-22033',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenMithuna}` }
  });
  assert(mithunaHijackA.status === 403, `Mithuna attempting to access Riya order ORD-22033 is blocked with 403 Forbidden`);

  // Verify Mithuna cannot access Rohith's order ORD-31026 or ORD-77291
  const mithunaHijackB = await request({
    hostname: 'localhost',
    port: 5173,
    path: '/api/customer/orders/ORD-77291',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${tokenMithuna}` }
  });
  assert(mithunaHijackB.status === 403, `Mithuna attempting to access Rohith order ORD-77291 is blocked with 403 Forbidden`);

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
