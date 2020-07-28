import { Crypto } from "ring-crypto";
import { Buffer } from "buffer"; 

const generateRing = async () => {
    const ringSize = 20;
    const ring = [];
    for (let i = 0; i < ringSize - 1; i++) {
        const keyPair = await Crypto.Sign.keyPair();
        ring.push(keyPair.s_public_key);
    }
    const secretKeyPair = await Crypto.Sign.keyPair();
    ring.push(secretKeyPair.s_public_key);
 
    const msg = Buffer.from("ring sign me!");
    const ringSig = await Crypto.Ring.sign(msg, secretKeyPair, ring);
    const valid = await Crypto.Ring.verify(msg, ring, ringSig);
    return valid;
}

console.log(generateRing());