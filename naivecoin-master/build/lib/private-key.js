"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const public_key_1 = require("./public-key");
const signature_1 = require("./signature");
const bn_js_1 = require("bn.js");
const shuffle_array_1 = require("shuffle-array");
class PrivateKey {
    constructor(value, hasher) {
        this.value = new bn_js_1.default(value.toString(), 16);
        this.hasher = hasher;
        this.public_key = new public_key_1.default(this.hasher.G.mul(this.value), this.hasher);
        this.key_image = this.hasher.hash_point(this.public_key.point).mul(this.value); //I = x*Hp(P)
    }
    get point() {
        return this.public_key.point;
    }
    sign(message, foreign_keys) {
        const message_digest = this.hasher.hash_string(message);
        const seed = this.hasher.hash_array([this.value, message_digest]);
        let all_keys = foreign_keys.slice();
        all_keys.push(this);
        shuffle_array_1.default(all_keys);
        const q_array = this.generate_q(all_keys, seed); // hex numbers
        const w_array = this.generate_w(all_keys, seed); // hex number + 1 BN
        const ll_array = this.generate_ll(all_keys, q_array, w_array);
        const rr_array = this.generate_rr(all_keys, q_array, w_array, this.key_image);
        let challenge_arr = [message_digest];
        challenge_arr = challenge_arr.concat(ll_array);
        challenge_arr = challenge_arr.concat(rr_array);
        const challenge = this.hasher.hash_array(challenge_arr);
        const c_array = this.generate_c(all_keys, q_array, w_array, challenge);
        const r_array = this.generate_r(all_keys, q_array, w_array, c_array, challenge);
        let public_keys = [];
        for (let i = 0; i < all_keys.length; i++) {
            if (all_keys[i] instanceof PrivateKey) {
                public_keys.push(all_keys[i].public_key);
            }
            else {
                public_keys.push(all_keys[i]);
            }
        }
        return new signature_1.default(this.key_image, c_array, r_array, public_keys, this.hasher);
    }
    generate_r(all_keys, q_array, w_array, c_array, challenge) {
        let r_array = [];
        for (let i = 0; i < all_keys.length; i++) {
            if (all_keys[i] instanceof public_key_1.default) {
                r_array.push(new bn_js_1.default(q_array[i], 16));
            }
            else {
                let ri = new bn_js_1.default(q_array[i], 16).sub(all_keys[i].value.mul(c_array[i]));
                ri = ri.umod(this.hasher.l);
                r_array.push(ri);
            }
        }
        return r_array;
    }
    generate_c(all_keys, q_array, w_array, challenge) {
        let c_array = [];
        for (let i = 0; i < all_keys.length; i++) {
            if (all_keys[i] instanceof public_key_1.default) {
                c_array.push(new bn_js_1.default(w_array[i], 16));
            }
            else {
                let chNum = new bn_js_1.default(challenge, 16);
                let wSum = w_array.reduce((acc, val) => { return acc = acc.add(new bn_js_1.default(val, 16)); }, new bn_js_1.default(0, 16));
                let ci = chNum.sub(wSum).umod(this.hasher.l);
                c_array.push(ci);
            }
        }
        return c_array;
    }
    generate_rr(all_keys, q_array, w_array, key_image) {
        let rr_array = [];
        for (let i = 0; i < all_keys.length; i++) {
            let rri = all_keys[i].point;
            rri = this.hasher.hash_point(rri);
            rri = rri.mul(new bn_js_1.default(q_array[i], 16));
            if (all_keys[i] instanceof public_key_1.default) {
                rri = rri.add(key_image.mul(new bn_js_1.default(w_array[i], 16)));
            }
            rr_array.push(rri);
        }
        return rr_array;
    }
    generate_ll(all_keys, q_array, w_array) {
        let ll_array = [];
        for (let i = 0; i < all_keys.length; i++) {
            let lli = this.hasher.G.mul(new bn_js_1.default(q_array[i], 16));
            ll_array.push(lli);
            if (all_keys[i] instanceof public_key_1.default) {
                ll_array[i] = ll_array[i].add(all_keys[i].point.mul(new bn_js_1.default(w_array[i], 16)));
            }
        }
        return ll_array;
    }
    generate_w(all_keys, seed) {
        let w_array = [];
        for (let i = 0; i < all_keys.length; i++) {
            if (all_keys[i] instanceof public_key_1.default) {
                w_array.push(this.hasher.hash_array(['w', seed, i]));
            }
            else {
                w_array.push(new bn_js_1.default(0, 16));
            }
        }
        return w_array;
    }
    generate_q(all_keys, seed) {
        let q_array = [];
        for (let i = 0; i < all_keys.length; i++) {
            let qi = this.hasher.hash_array(['q', seed, i]);
            q_array.push(qi);
        }
        return q_array;
    }
}
exports.default = PrivateKey;
//# sourceMappingURL=private-key.js.map