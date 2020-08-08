import Hasher from './lib/hasher.js';
import PrivateKey from './lib/private-key.js';
import PublicKey from './lib/public-key.js';
import Prng from './lib/prng.js';
import Signature from './lib/signature.js';

import * as util from 'util' // has no default export
const {parse, stringify} = require('flatted/cjs');
import { sign } from 'crypto';
// or 


const prng = new Prng();
const hasher = new Hasher();
const key = new PrivateKey("fa8ec2bf1e3d0d75511e9e2b2f35f3aff500ce0326ae252bc84b02d725793c73",hasher);
//console.log("Public key");
//console.log(prng.random);
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
const test = signature.public_keys;
//verify signature using msg and public keys
//signature.hasher = null;

//04bfcab8722991ae774db48f934ca79cfb7dd991229153b9f732ba5334aafcd8e7266e47076996b55a14bf9913ee3145ce0cfc1372ada8ada74bd287450313534a

JSON.safeStringify = (obj, indent = 2) => {
    let cache = [];
    const retVal = JSON.stringify(
      obj,
      (key, value) =>
        typeof value === "object" && value !== null
          ? cache.includes(value)
            ? undefined // Duplicate reference found, discard key
            : cache.push(value) && value // Store value in our collection
          : value,
      indent
    );
    cache = null;
    return retVal;
  };

const toHexString = (byteArray) => {
  return Array.from(byteArray, (byte) => {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
};
  
//console.log("1st Result: ",JSON.safeStringify(signature));
console.log("2nd Result: ", toHexString(foreign_keys));