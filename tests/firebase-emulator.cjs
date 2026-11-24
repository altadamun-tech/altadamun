const { after, test } = require("node:test");
const assert = require("node:assert/strict");
const { createRequire } = require("node:module");
const load = createRequire(require("node:path").resolve(__dirname, "../hrims/hris/package.json"));
const { initializeApp, deleteApp } = load("firebase/app");
const { getAuth, connectAuthEmulator, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } = load("firebase/auth");
const {
  getFirestore, connectFirestoreEmulator, collection, query, where, getDocsFromServer, doc, getDocFromServer, setDoc, writeBatch, serverTimestamp
} = load("firebase/firestore");
const { getStorage, connectStorageEmulator, ref: storageRef, uploadBytes, getBytes } = load("firebase/storage");
const projectId = "demo-altadamun-accounts";
const apps = [];
const base = "http://127.0.0.1:8080/v1/projects/" + projectId + "/databases/(default)/documents";
const password = "emulator-only-test-password";
after(async () => Promise.all(apps.map(deleteApp)));

async function client(role) {
  const name = role + "-" + crypto.randomUUID();
  const app = initializeApp({ projectId, apiKey: "emulator-only", storageBucket: projectId + ".appspot.com" }, name);
  apps.push(app);
  const db = getFirestore(app);
  const email = name.toLowerCase() + "@example.test";
  let user;
  if (process.env.ALTADAMUN_TEST_FIRESTORE_ONLY === "1" && role !== "anonymous") {
    user = { uid: name, email };
    connectFirestoreEmulator(db, "127.0.0.1", 8080, { mockUserToken: { sub: user.uid, email } });
  } else {
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    if (role === "anonymous") return { db, app };
    const auth = getAuth(app);
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    const created = (await createUserWithEmailAndPassword(auth, email, password)).user;
    await signOut(auth);
    await assert.rejects(signInWithEmailAndPassword(auth, email, "wrong-emulator-password"));
    user = (await signInWithEmailAndPassword(auth, email, password)).user;
    assert.equal(user.uid, created.uid);
  }
  const fields = { active: { booleanValue: true }, role: { stringValue: role } };
  const seed = await fetch(base + "/users/" + user.uid, {
    method: "PATCH", headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    body: JSON.stringify({ fields })
  });
  assert.equal(seed.status, 200, await seed.text());
  return { db, user, role, app };
}

function commit(client, row, event, suffix) {
  const { db, user } = client;
  const batch = writeBatch(db);
  const auditId = String(row.id) + "-" + suffix;
  batch.set(doc(db, "requests", String(row.id)), { ...row, auditId, updatedAt: serverTimestamp() });
  batch.set(doc(db, "auditLogs", auditId), {
    action: event, actor: user.uid, user: user.email, requestId: String(row.id), timestamp: serverTimestamp()
  });
  return batch.commit();
}

function requestFor(client) {
  return {
    id: Number(crypto.getRandomValues(new Uint32Array(1))[0]) + 1, requestType: "Test", title: "Test", requestDetails: "Test", description: "Test",
    receiptNo: "", employeeName: "Test", requesterName: "Test", department: "Test", amount: 123,
    currency: "IQD", priority: "Normal", notes: "", requesterSignature: "", managerSignature: "",
    attachments: [], createdUid: client.user.uid, createdBy: client.user.email, createdRole: client.role,
    financeVisible: false, approvalRoute: ["CEO", "FNS"], currentApprovalIndex: 0, approvalHistory: [],
    status: "Pending", date: serverTimestamp(), whatsappNumber: null
  };
}

test("isolated emulator enforces request transitions, role assignment and append-only audit", async () => {
  const [sns, fns, ceo, it, anonymous] = await Promise.all(["SNS", "FNS", "CEO", "IT", "anonymous"].map(client));
  const row = requestFor(sns);
  const ref = c => doc(c.db, "requests", String(row.id));
  const read = async c => (await getDocFromServer(ref(c))).data();
  const decision = (before, actor, role, status, currentApprovalIndex, action) => ({
    ...before, status, currentApprovalIndex, financeVisible: currentApprovalIndex === 1, decisionNote: "",
    approvalHistory: [...before.approvalHistory, {
      role, user: actor.user.email, action, note: "", at: new Date().toISOString()
    }]
  });
  const denied = promise => assert.rejects(promise, error => error.code === "permission-denied");
  await denied(setDoc(ref(sns), { ...row, updatedAt: serverTimestamp(), auditId: "unlinked" }));
  const testStorage = process.env.ALTADAMUN_TEST_STORAGE === "1";
  const bytes = new TextEncoder().encode("%PDF-1.4");
  function object(client) {
    const storage = getStorage(client.app);
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    return storageRef(storage, ["requestFiles", sns.user.uid, row.id, "invoice.pdf"].join("/"));
  }
  let staged;
  if (testStorage) {
    staged = object(sns);
    await uploadBytes(staged, bytes, { contentType: "application/pdf" });
    await assert.rejects(getBytes(staged), error => error.code === "storage/unauthorized");
    row.attachments.push("invoice.pdf");
  }
  await commit(sns, row, "created", "created");
  if (testStorage) {
    assert.deepEqual(new Uint8Array(await getBytes(object(it))), bytes);
    await assert.rejects(getBytes(object(anonymous)), error => error.code === "storage/unauthorized");
    await assert.rejects(uploadBytes(staged, bytes, { contentType: "application/pdf" }), error => error.code === "storage/unauthorized");
  }
  const pending = await read(ceo);
  assert.equal(pending.status, "Pending");
  await denied(read(anonymous));
  await denied(read(sns));
  await denied(read(fns));
  await denied(getDocsFromServer(collection(fns.db, "requests")));
  const financeInbox = query(collection(fns.db, "requests"), where("financeVisible", "==", true));
  assert.equal((await getDocsFromServer(financeInbox)).empty, true);
  await denied(setDoc(doc(sns.db, "users", sns.user.uid), { role: "IT", active: true }));
  await denied(commit(fns, requestFor(fns), "created", "fns-create"));
  await denied(commit(fns, decision(pending, fns, "FNS", "Paid", 1, "Paid"), "paid", "too-early"));
  await denied(commit(ceo, { ...decision(pending, ceo, "CEO", "Pending", 1, "Approve"), amount: 1 }, "preapproved", "changed-amount"));
  await commit(ceo, decision(pending, ceo, "CEO", "Pending", 1, "Approve"), "preapproved", "ceo");
  assert.equal((await getDocsFromServer(financeInbox)).size, 1);
  const payPending = await read(fns);
  await denied(commit(ceo, decision(payPending, ceo, "FNS", "Paid", 1, "Paid"), "paid", "wrong-role"));
  await commit(fns, decision(payPending, fns, "FNS", "Paid", 1, "Paid"), "paid", "fns");
  assert.equal((await read(it)).status, "Paid");
  await denied(commit(fns, decision(await read(fns), fns, "FNS", "NotPaid", 1, "NotPaid"), "not_paid", "reopened"));
  const log = c => doc(c.db, "auditLogs", String(row.id) + "-fns");
  assert.equal((await getDocFromServer(log(it))).get("actor"), fns.user.uid);
  await denied(getDocFromServer(log(sns)));
  await denied(setDoc(log(it), { action: "edited" }));
  const second = requestFor(sns);
  await commit(sns, second, "created", "created");
  const secondRef = doc(it.db, "requests", String(second.id));
  const beforeSecond = (await getDocFromServer(secondRef)).data();
  await commit(it, decision(beforeSecond, it, "CEO", "Pending", 1, "Approve"), "preapproved", "it-preapproval");
  await commit(fns, decision((await getDocFromServer(secondRef)).data(), fns, "FNS", "NotPaid", 1, "NotPaid"), "not_paid", "fns-not-paid");
  assert.equal((await getDocFromServer(secondRef)).get("status"), "NotPaid");
});
