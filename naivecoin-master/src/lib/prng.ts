import {XorShift128Plus} from 'xorshift.js';
import * as crypto from 'crypto';

class Prng{
  private seed:any;
  private prng:XorShift128Plus;
  constructor(){
    this.seed = crypto.randomBytes(16).toString('hex');
    this.prng = new XorShift128Plus(this.seed);
  }

  get random(){
    return this.prng.randomBytes(32).toString('hex');
  }
}

export {Prng};