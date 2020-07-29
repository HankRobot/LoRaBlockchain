"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BN = require("bn.js");
const keccakHash = require("keccak");
const elliptic_1 = require("elliptic");
const public_key_1 = require("./public-key");
class Hasher {
    constructor() {
        this.ec = new elliptic_1.eddsa('ed25519');
    }
    get G() {
        return this.ec.g;
    }
    get l() {
        return this.ec.curve.n;
    }
    hash_string(message) {
        let msgHash = keccakHash('keccak256').update(message).digest('hex');
        msgHash = new BN(msgHash.toString(), 16);
        msgHash = msgHash.mod(this.l);
        msgHash = msgHash.toString(16);
        return msgHash;
    }
    hash_point(point) {
        let pointArr = [point.x, point.y];
        return this.G.mul(new BN(this.hash_array(pointArr), 16));
    }
    hash_array(array) {
        let hash_array = [];
        for (let i = 0; i < array.length; i++) {
            if (array[i].isArray != undefined && array[i].isArray()) {
                hash_array.push(this.hash_array(array[i]));
            }
            else if (array[i] instanceof public_key_1.PublicKey) {
                hash_array.push(this.hash_point(array[i].point));
            }
            else if (array[i] instanceof BN) {
                let hash_i = array[i].toString(16);
                hash_i = this.hash_string(hash_i);
                hash_array.push(hash_i);
            }
            else if (typeof array[i] === 'string') {
                hash_array.push(this.hash_string(array[i]));
            }
            else if (typeof array[i] === 'number') {
                hash_array.push(this.hash_string(array[i].toString()));
            }
            else if (array[i].x !== undefined && array[i].y !== undefined) {
                hash_array.push(this.hash_string(array[i].encode('hex').toString()));
            }
            else {
                console.log(array[i]);
                throw 'hash_array() case not implemented';
            }
        }
        let concat = hash_array.reduce((acc, val) => { return acc += val.toString(); });
        return this.hash_string(concat);
    }
}
exports.Hasher = Hasher;
//# sourceMappingURL=hasher.js.map