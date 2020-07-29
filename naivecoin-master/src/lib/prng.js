"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xorshift_js_1 = require("xorshift.js");
const crypto = require("crypto");
class Prng {
    constructor() {
        this.seed = crypto.randomBytes(16).toString('hex');
        this.prng = new xorshift_js_1.XorShift128Plus(this.seed);
    }
    get random() {
        return this.prng.randomBytes(32).toString('hex');
    }
}
exports.Prng = Prng;
//# sourceMappingURL=prng.js.map