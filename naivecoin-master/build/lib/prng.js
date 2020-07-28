"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const xorshift_js_1 = require("xorshift.js");
const crypto_1 = require("crypto");
class Prng {
    constructor() {
        this.seed = crypto_1.default.randomBytes(16).toString('hex');
        this.prng = new xorshift_js_1.XorShift128Plus(this.seed);
    }
    get random() {
        return this.prng.randomBytes(32).toString('hex');
    }
}
exports.default = Prng;
//# sourceMappingURL=prng.js.map