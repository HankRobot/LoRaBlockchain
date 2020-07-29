import BN from 'bn.js';

class PublicKey{
  public point:any;
  private hasher:any;
  
  constructor(point,hasher){
    this.point = point;
    this.hasher = hasher;
  }  
}

export {PublicKey};