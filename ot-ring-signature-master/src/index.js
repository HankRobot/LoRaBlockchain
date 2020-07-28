import Hasher from './lib/hasher.js';
import PrivateKey from './lib/private-key.js';
import PublicKey from './lib/public-key.js';
import Prng from './lib/prng.js';
import Signature from './lib/signature.js';

const prng = new Prng();
const hasher = new Hasher();
const key = new PrivateKey(prng.random,hasher);
//create private keys and their corresponding public keys
const foreign_keys = [new PrivateKey(prng.random,hasher).public_key,
                      new PrivateKey(prng.random,hasher).public_key,
                      new PrivateKey(prng.random,hasher).public_key];

//message to sign
const msg = 'one ring to rule them all';
//create ring signature by signing with the private key
const signature = key.sign(msg,foreign_keys);
//get the public keys from the signature 
const public_keys = signature.public_keys;
//verify signature using msg and public keys
console.log(signature.verify(msg,public_keys));
