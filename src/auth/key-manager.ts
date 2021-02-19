import dayjs from 'dayjs';
import fs from 'fs';

interface Identity {
  created: string;
  isBanned: boolean;
  key: string;
  lastUsed: string;
}

type KeyStore = Identity[];

const KEY_STORE = `${__dirname}/key-store.json`;

function fetchKeyStore() {
  if (!fs.existsSync(KEY_STORE)) {
    return [];
  }

  const keyStore = fs.readFileSync(KEY_STORE, { encoding: 'utf8' });

  if (!keyStore) {
    return [];
  }

  return JSON.parse(keyStore) as KeyStore;
}

function updateKey(key: string, newValues: Partial<Pick<Identity, 'isBanned' | 'lastUsed'>>) {
  const keyStore = fetchKeyStore();
  const identities = keyStore.map((identity) => {
    if (identity.key === key) {
      return { ...identity, ...newValues };
    }
    return identity;
  });

  fs.writeFileSync(KEY_STORE, JSON.stringify(identities, null, 2), { encoding: 'utf8', flag: 'w' });

  return identities.find((identity) => identity.key === key);
}

export function addKey(key: string) {
  const keyStore = fetchKeyStore();
  const existingIdentity = getIdentity(key);

  if (typeof existingIdentity !== 'undefined') {
    throw new Error(`Identity with key already exists: ${key}`);
  }

  const identity = {
    created: dayjs().toISOString(),
    isBanned: false,
    key,
    lastUsed: dayjs().toISOString(),
  };

  fs.writeFileSync(KEY_STORE, JSON.stringify([...keyStore, identity], null, 2), { encoding: 'utf8', flag: 'w' });

  return identity as Identity;
}

export function banKey(key: string) {
  return updateKey(key, { isBanned: true });
}

export function getIdentity(key: string) {
  const keyStore = fetchKeyStore();
  return keyStore.find((identity) => identity.key === key);
}

export function removeKey(key: string) {
  const keyStore = fetchKeyStore();

  fs.writeFileSync(
    KEY_STORE,
    JSON.stringify(
      keyStore.filter((identity) => identity.key !== key),
      null,
      2,
    ),
    { encoding: 'utf8', flag: 'w' },
  );
}

export function updateLastUsed(key: string) {
  return updateKey(key, { lastUsed: dayjs().toISOString() });
}
