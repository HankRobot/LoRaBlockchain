import {XorShift128Plus} from 'xorshift.js';
import * as crypto from 'crypto';

//import * as bigInt from 'big-integer';

class Prng{
  private seed:string;
  private prng:XorShift128Plus;
  constructor(){
    this.seed = crypto.randomBytes(16).toString('hex');
    this.prng = new XorShift128Plus(this.seed);
  }

  get random(){
    return this.prng.randomBytes(32).toString('hex');
  }
}

/*
const bitSecurity = 32

const bigMath = {
  add(a, b, c) {
    if (c) {
      return bigInt(a.toString()).add(b.toString()).mod(c)
    }
    return bigInt(a.toString()).add(b.toString())
  },
  subtract(a, b, c) {
    if (c) {
      return bigInt(a.toString()).subtract(b.toString()).mod(c)
    }
    return bigInt(a.toString()).subtract(b.toString())
  },
  multiply(a, b, c)  {
    if (c) {
      return bigInt(a.toString()).multiply(b.toString()).mod(c)
    }
    return bigInt(a.toString()).multiply(b.toString())
  },
  divide(a, b, c) {
    if (c) {
      return bigInt(a.toString()).divide(b.toString()).mod(c)
    }
    return bigInt(a.toString()).divide(b.toString())
  },
  power(p, s, c)  {
    if (c) {
      return bigInt(p.toString()).modPow(s, c)
    }
    return bigInt(p.toString()).pow(s)
  }
}

class Pedersen {
  private absctractMath:any;
  private p:any;
  private g:any;
  private q:any;
  constructor(p, g) {
    this.absctractMath = bigMath
    this.p = bigInt(p, 16)
    this.g = bigInt(g, 16)
    this.q = this.absctractMath.add(
      this.absctractMath.multiply(this.p, 2),
      1
    )
  }

  newSecret() {
    return this.newOffset()
  }

  newOffset() {
    let r = bigInt(0)
    while (r.compare(0) !== 1 || r.compare(this.p) !== -1 ) {
      r = bigInt.fromArray([...crypto.randomBytes(bitSecurity)], 256)
      r = r.mod(this.p)
    }
    r = r.mod(this.p)
    return r.toString(16).padStart(40, '0')
  }

  commit(message, secret, r = this.newOffset()){
    const nr = bigInt(r, 16)
    const m = bigInt(message, 16)
    const h = bigInt(this.g).modPow(bigInt(secret, 16), this.q)

    const c = this.absctractMath.multiply(
      this.absctractMath.power(this.g, m, this.q),
      this.absctractMath.power(h,nr, this.q),
      this.q,
    )
    return [c.toString(16), nr.toString(16)]
  }

  verify(message, commitments, secret) {
    const commitment = this.combine(commitments)
    const r = commitment[1]
    const c = this.commit(message.toString(16), secret, r)
    
    return c.toString() === commitment.toString()
  }
  
  combine(commitments) {
    let c = bigInt('1')
    let r = bigInt('0')
    for (const commitment of commitments) {
      c = c.multiply(bigInt(commitment[0], 16)).mod(this.q)
      r = r.add(bigInt(commitment[1], 16))
    }
    return [c.toString(16), r.toString(16)]
  }
}
*/
export {Prng
        //,Pedersen
      };