(function () {
  const cfg = window.FIREBASE_CONFIG;
  if (cfg?.projectId !== "altadamun-accounts" || !window.firebase) return;
  const app = firebase.initializeApp(cfg, "altadamun-accounts");
  const auth = app.auth();
  const db = app.firestore();
  const requests = db.collection("requests");
  const logs = db.collection("auditLogs");
  const roles = ["IT", "FNS", "SNS", "CEO"];

  function firstUser() {
    return new Promise((resolve, reject) => {
      const stop = auth.onAuthStateChanged(user => { stop(); resolve(user); }, reject);
    });
  }

  async function profile(user) {
    if (!user) return null;
    const snap = await db.collection("users").doc(user.uid).get({ source: "server" });
    const role = snap.get("role");
    if (snap.get("active") !== true || !roles.includes(role)) return null;
    return { uid: user.uid, username: user.email, role };
  }

  function audit(transaction, log, event, id) {
    const data = { actor: auth.currentUser.uid, user: auth.currentUser.email, action: event,
      requestId: id, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
    if (transaction) transaction.set(log, data);
    else return log.set(data);
  }

  function mutate(record, event, prior = null) {
    const ref = requests.doc(String(record.id));
    const log = logs.doc();
    if (event === "created") {
      const batch = db.batch();
      const serverTime = firebase.firestore.FieldValue.serverTimestamp();
      batch.set(ref, { ...record, date: serverTime, updatedAt: serverTime, auditId: log.id });
      audit(batch, log, event, String(record.id));
      return batch.commit();
    }
    return db.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists || snap.get("auditId") !== prior?.auditId)
        throw new Error("Request changed");
      const serverTime = firebase.firestore.FieldValue.serverTimestamp();
      tx.set(ref, { ...record, date: snap.get("date"),
        updatedAt: serverTime, auditId: log.id });
      audit(tx, log, event, String(record.id));
    });
  }

  function fileRef(uid, requestId, name) {
    return app.storage().ref().child("requestFiles").child(uid).child(String(requestId)).child(name);
  }

  async function uploadFiles(files, id) {
    const uid = auth.currentUser.uid;
    const uploaded = [];
    async function rollback() {
      await Promise.allSettled(uploaded.map(ref => ref.delete()));
    }
    try {
      for (const file of files) {
        const ref = fileRef(uid, id, file.name);
        await ref.put(file, { contentType: file.type });
        uploaded.push(ref);
      }
    } catch (error) {
      await rollback();
      throw error;
    }
    return rollback;
  }

  async function downloadFile(record, name) {
    const token = await auth.currentUser.getIdToken();
    const ref = fileRef(record.createdUid, record.id, name);
    const endpoint = "https://firebasestorage.googleapis.com/v0/b/" + ref.bucket
      + "/o/" + encodeURIComponent(ref.fullPath) + "?alt=media";
    const response = await fetch(endpoint, { headers: { Authorization: "Firebase " + token } });
    if (!response.ok) throw new Error("Storage download failed");
    return response.blob();
  }

  function displayRows(snapshot) {
    return snapshot.docs.map(doc => doc.data()).filter(row => !row.deleted)
      .map(row => ({ ...row, date: row.date.toDate().toISOString(), updatedAt: row.updatedAt.toDate().toISOString() }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  const visibleRequests = role => role === "FNS" ? requests.where("financeVisible", "==", true) : requests;

  window.IRSCloud = {
    firstUser, profile, mutate, uploadFiles, downloadFile,
    signIn: (email, password) => auth.signInWithEmailAndPassword(email, password),
    signOut: () => auth.signOut(),
    watchSession: callback => auth.onAuthStateChanged(callback),
    watchProfile: (uid, next, fail) => db.collection("users").doc(uid).onSnapshot(snap => {
      if (!snap.metadata.fromCache) next(snap.get("active") === true ? snap.get("role") : null);
    }, fail),
    watchRequests: (role, next, fail) => {
      let connected = false;
      return visibleRequests(role).onSnapshot({ includeMetadataChanges: true }, snap => {
        if (snap.metadata.hasPendingWrites) return;
        if (snap.metadata.fromCache) {
          if (connected) fail(new Error("Firestore returned offline data"));
          return;
        }
        connected = true;
        try { next(displayRows(snap)); } catch (error) { fail(error); }
      }, fail);
    },
    readRequests: async role => displayRows(await visibleRequests(role).get({ source: "server" })),
    readLogs: async () => (await logs.orderBy("timestamp", "desc").limit(1000).get({ source: "server" }))
      .docs.map(doc => ({ ...doc.data(), timestamp: doc.get("timestamp").toDate().toISOString() })),
    note: event => audit(null, logs.doc(), event, null)
  };
})();
