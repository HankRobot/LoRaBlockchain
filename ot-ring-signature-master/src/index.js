import Hasher from './lib/hasher.js';
import PrivateKey from './lib/private-key.js';
import PublicKey from './lib/public-key.js';
import Prng from './lib/prng.js';
import Signature from './lib/signature.js';

const prng = new Prng();
const hasher = new Hasher();
const key = new PrivateKey(prng.random,hasher);

const foreign_keys = [new PrivateKey(prng.random,hasher).public_key,
                      new PrivateKey(prng.random,hasher).public_key,
                      new PrivateKey(prng.random,hasher).public_key];

const msg = 'one ring to rule them all';
const signature = key.sign(msg,foreign_keys);
const public_keys = signature.public_keys;

const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
  };
  
console.log(JSON.stringify(signature, getCircularReplacer()));
console.log(signature.verify(msg,public_keys));