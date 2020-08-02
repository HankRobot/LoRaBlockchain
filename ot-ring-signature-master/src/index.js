import Hasher from './lib/hasher.js';
import PrivateKey from './lib/private-key.js';
import PublicKey from './lib/public-key.js';
import Prng from './lib/prng.js';
import Signature from './lib/signature.js';

const prng = new Prng();
const hasher = new Hasher();
const key = new PrivateKey("fa8ec2bf1e3d0d75511e9e2b2f35f3aff500ce0326ae252bc84b02d725793c73",hasher);
//console.log("Public key");
//console.log(prng.random);
console.log("Hasher");
console.log(hasher.hash_string);
//create private keys and their corresponding public keys
const foreign_keys = [new PrivateKey(prng.random,hasher).public_key,
                      new PrivateKey(prng.random,hasher).public_key,
                      new PrivateKey(prng.random,hasher).public_key];

//message to sign
const msg = 'one ring to rule them all';
//create ring signature by signing with the private key
const signature = key.sign(msg,foreign_keys);
const signature2 = key.sign(msg,foreign_keys);
//get the public keys from the signature 
const public_keys = key.generate_public_keys(foreign_keys);
const test = signature.public_keys;
//verify signature using msg and public keys
console.log(signature.getc_summation() === signature2.getc_summation());
