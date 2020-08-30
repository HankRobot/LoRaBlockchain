import * as CryptoJS from 'crypto-js';
import * as ecdsa from 'elliptic';
import * as _ from 'lodash';
const ec = new ecdsa.ec('secp256k1');
import * as util from 'util' // has no default export
const COINBASE_AMOUNT: number = 50;
import {parse, stringify} from 'flatted';

import {Hasher} from './lib/hasher';
import {PrivateKey} from './lib/private-key';
import {PublicKey} from './lib/public-key';
import {Prng} from './lib/prng';
import {Signature} from './lib/signature';
import { //getPublicFromWallet, getPrivateFromWallet, 
    getRingPrivateFromWallet, getRingPublicFromWallet, PedersenCommitment, getPublicFromWallet, stealthDualSend} from './wallet';

import * as ecurve from 'ecurve'
import * as bigi from 'bigi'
var secp256k1 = ecurve.getCurveByName('secp256k1')
var G = secp256k1.G
var n = secp256k1.n
    

class UnspentTxOut {
    public readonly txOutId: string;
    public readonly txOutIndex: number;
    public readonly stealthaddress: string;
    public readonly amount: number;
    public readonly pedersen: any;
    public readonly secret: any;

    constructor(txOutId: string, txOutIndex: number, stealthaddress: string, amount: number, pedersen:any, secret:any) {
        this.txOutId = txOutId;
        this.txOutIndex = txOutIndex;
        this.pedersen = pedersen;
        this.secret = secret;
        this.stealthaddress = stealthaddress;
        this.amount = amount;
    }
}

class TxIn {
    public txOutId: string;
    public txOutIndex: number;
    public signature: any;
    public signaturestring: string;
}

class TxOut {
    public nounce: string;
    public stealthadd: string;
    public amount: number;
    public pedersen: any;
    public secret: any;

    constructor(nounce:string, stealthadd:string, amount: number, pedersen:any, secret:any) {
        this.nounce = nounce;
        this.stealthadd = stealthadd;
        this.amount = amount;
        this.pedersen = pedersen;
        this.secret = secret;
    }
}

class Transaction {
    public id: string;

    public txIns: TxIn[];
    public txOuts: TxOut[];
}

const getTransactionId = (transaction: Transaction): string => {
    const txInContent: string = transaction.txIns
        .map((txIn: TxIn) => txIn.txOutId + txIn.txOutIndex)
        .reduce((a, b) => a + b, '');

    const txOutContent: string = transaction.txOuts
        .map((txOut: TxOut) => txOut.nounce + txOut.stealthadd + txOut.amount + txOut.pedersen + txOut.secret)
        .reduce((a, b) => a + b, '');
    console.log("Correct Transaction ID",CryptoJS.SHA256(txInContent + txOutContent).toString())
    return CryptoJS.SHA256(txInContent + txOutContent).toString();
};

const validateTransaction = (transaction: Transaction, aUnspentTxOuts: UnspentTxOut[]): boolean => {

    if (!isValidTransactionStructure(transaction)) {
        return false;
    }

    if (getTransactionId(transaction) !== transaction.id) {
        console.log('invalid tx id: ' + transaction.id);
        return false;
    }
    const hasValidTxIns: boolean = transaction.txIns
        .map((txIn) => validateTxIn(txIn, transaction, aUnspentTxOuts))
        .reduce((a, b) => a && b, true);

    if (!hasValidTxIns) {
        console.log('some of the txIns are invalid in tx: ' + transaction.id);
        return false;
    }

    const totalTxInValues: number = transaction.txIns
        .map((txIn) => getTxInAmount(txIn, aUnspentTxOuts))
        .reduce((a, b) => (a + b), 0);

    const totalTxOutValues: number = transaction.txOuts
        .map((txOut) => txOut.amount)
        .reduce((a, b) => (a + b), 0);

    /*    
    if (totalTxOutValues !== totalTxInValues) {
        console.log('totalTxOutValues !== totalTxInValues in tx: ' + transaction.id);
        return false;
    }
    */
    return true;
};

const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
};

const safeStringify = (obj, indent = 2) => {
    /*
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
    */
   //return util.inspect(obj);
   return JSON.stringify(obj,getCircularReplacer())
   //return stringify(obj);
};

const validateBlockTransactions = (aTransactions: Transaction[], aUnspentTxOuts: UnspentTxOut[], blockIndex: number): boolean => {
    const coinbaseTx = aTransactions[0];
    if (!validateCoinbaseTx(coinbaseTx, blockIndex)) {
        console.log('invalid coinbase transaction: ' + safeStringify(coinbaseTx));
        return false;
    }

    // check for duplicate txIns. Each txIn can be included only once
    const txIns: TxIn[] = _(aTransactions)
        .map((tx) => tx.txIns)
        .flatten()
        .value();

    if (hasDuplicates(txIns)) {
        return false;
    }

    // all but coinbase transactions
    const normalTransactions: Transaction[] = aTransactions.slice(1);
    return normalTransactions.map((tx) => validateTransaction(tx, aUnspentTxOuts))
        .reduce((a, b) => (a && b), true);

};

const hasDuplicates = (txIns: TxIn[]): boolean => {
    const groups = _.countBy(txIns, (txIn: TxIn) => txIn.txOutId + txIn.txOutIndex);
    return _(groups)
        .map((value, key) => {
            if (value > 1) {
                console.log('duplicate txIn: ' + key);
                return true;
            } else {
                return false;
            }
        })
        .includes(true);
};

const validateCoinbaseTx = (transaction: Transaction, blockIndex: number): boolean => {
    if (transaction == null) {
        console.log('the first transaction in the block must be coinbase transaction');
        return false;
    }
    if (getTransactionId(transaction) !== transaction.id) {
        console.log('invalid coinbase tx id: ' + transaction.id);
        return false;
    }
    if (transaction.txIns.length !== 1) {
        console.log('one txIn must be specified in the coinbase transaction');
        return;
    }
    if (transaction.txIns[0].txOutIndex !== blockIndex) {
        console.log('the txIn signature in coinbase tx must be the block height');
        return false;
    }
    if (transaction.txOuts.length !== 1) {
        console.log('invalid number of txOuts in coinbase transaction');
        return false;
    }
    /*
    if (transaction.txOuts[0].amount !== COINBASE_AMOUNT) {
        console.log('invalid coinbase amount in coinbase transaction');
        return false;
    }
    */
    return true;
};

const validateTxIn = (txIn: TxIn, transaction: Transaction, aUnspentTxOuts: UnspentTxOut[]): boolean => {
    const referencedUTxOut: UnspentTxOut =
        aUnspentTxOuts.find((uTxO) => uTxO.txOutId === txIn.txOutId && uTxO.txOutIndex === txIn.txOutIndex);
    if (referencedUTxOut == null) {
        console.log('referenced txOut not found: ' + safeStringify(txIn));
        return false;
    }
    const address = referencedUTxOut.stealthaddress;
    
    const hasher = new Hasher();
    const key = new PrivateKey(getRingPrivateFromWallet()[0],hasher);
    const foreign_keys = getRingPublicFromWallet();
    //const signature = key.sign(transaction.id,foreign_keys);
    const signature:Signature = txIn.signature;
    const validSignature: boolean = signature.verify(transaction.id,signature.public_keys)

    if (!validSignature) {
        console.log('invalid txIn signature: %s txId: %s address: %s', txIn.signature, transaction.id, referencedUTxOut.stealthaddress);
        return false;
    }
    return true;
};

const getTxInAmount = (txIn: TxIn, aUnspentTxOuts: UnspentTxOut[]): number => {
    return findUnspentTxOut(txIn.txOutId, txIn.txOutIndex, aUnspentTxOuts).amount;
};

const findUnspentTxOut = (transactionId: string, index: number, aUnspentTxOuts: UnspentTxOut[]): UnspentTxOut => {
    return aUnspentTxOuts.find((uTxO) => uTxO.txOutId === transactionId && uTxO.txOutIndex === index);
};

const getCoinbaseTransaction = (blockIndex: number): Transaction => {
    const t = new Transaction();
    const txIn: TxIn = new TxIn();
    txIn.signaturestring = '';
    txIn.signature = null;
    txIn.txOutId = '';
    txIn.txOutIndex = blockIndex;
    var forselfstealthaddress = stealthDualSend(bigi.fromHex(getPublicFromWallet()[2]),
                                                ecurve.Point.decodeFrom(secp256k1,Buffer.from(getPublicFromWallet()[0], "hex")), 
                                                ecurve.Point.decodeFrom(secp256k1,Buffer.from(getPublicFromWallet()[1], "hex"))
                                );
    t.txIns = [txIn];
    t.txOuts = [new TxOut(getPublicFromWallet()[0], forselfstealthaddress.getAddress().toString(), 1, PedersenCommitment(COINBASE_AMOUNT)[0], PedersenCommitment(COINBASE_AMOUNT)[1])];
    t.id = getTransactionId(t);
    return t;
};

const signTxIn = (transaction: Transaction, txInIndex: number,
                  address: PublicKey[], aUnspentTxOuts: UnspentTxOut[]): Signature => {
    const txIn: TxIn = transaction.txIns[txInIndex];

    const dataToSign = transaction.id;
    const referencedUnspentTxOut: UnspentTxOut = findUnspentTxOut(txIn.txOutId, txIn.txOutIndex, aUnspentTxOuts);
    if (referencedUnspentTxOut == null) {
        console.log('could not find referenced txOut');
        throw Error();
    }
    const referencedAddress = referencedUnspentTxOut.stealthaddress;
    /*
    if (getPublicKey(privateKey) !== referencedAddress) {
        console.log('trying to sign an input with private' +
            ' key that does not match the address that is referenced in txIn');
        throw Error();
    }
    */
    //const key = ec.keyFromPrivate(privateKey, 'hex');
    const hasher = new Hasher();
    const key = new PrivateKey(getRingPrivateFromWallet()[0],hasher);
    //create private keys and their corresponding public keys
                          
    //create ring signature by signing with the private key
    const signature = key.sign(dataToSign,address);
    
    //const signature: string = toHexString(key.sign(dataToSign).toDER());

    return signature;
};
                                                                                                                                                                    
const updateUnspentTxOuts = (aTransactions: Transaction[], aUnspentTxOuts: UnspentTxOut[]): UnspentTxOut[] => {
    const newUnspentTxOuts: UnspentTxOut[] = aTransactions
        .map((t) => {
            return t.txOuts.map((txOut, index) => new UnspentTxOut(t.id, index, txOut.stealthadd, txOut.amount, txOut.pedersen, txOut.secret));
        })
        .reduce((a, b) => a.concat(b), []);

    const consumedTxOuts: UnspentTxOut[] = aTransactions
        .map((t) => t.txIns)
        .reduce((a, b) => a.concat(b), [])
        .map((txIn) => new UnspentTxOut(txIn.txOutId, txIn.txOutIndex, '', 0, null, null));

    const resultingUnspentTxOuts = aUnspentTxOuts
        .filter(((uTxO) => !findUnspentTxOut(uTxO.txOutId, uTxO.txOutIndex, consumedTxOuts)))
        .concat(newUnspentTxOuts);

    return resultingUnspentTxOuts;
};

const processTransactions = (aTransactions: Transaction[], aUnspentTxOuts: UnspentTxOut[], blockIndex: number) => {

    if (!validateBlockTransactions(aTransactions, aUnspentTxOuts, blockIndex)) {
        console.log('invalid block transactions');
        return null;
    }
    return updateUnspentTxOuts(aTransactions, aUnspentTxOuts);
};

const toHexString = (byteArray): string => {
    return Array.from(byteArray, (byte: any) => {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
};

const getPublicKey = (aPrivateKey: string): string => {
    return ec.keyFromPrivate(aPrivateKey, 'hex').getPublic().encode('hex');
};

const isValidTxInStructure = (txIn: TxIn): boolean => {
    if (txIn == null) {
        console.log('txIn is null');
        return false;
    } else if (typeof txIn.signaturestring !== 'string') {
        console.log('1 invalid signature type in txIn');
        return false;
    }/*else if (typeof txIn.signature !== null) {
        console.log('2 invalid signature type in txIn');
        return false; 
    }*/else if (typeof txIn.txOutId !== 'string') {
        console.log('invalid txOutId type in txIn');
        return false;
    } else if (typeof  txIn.txOutIndex !== 'number') {
        console.log('invalid txOutIndex type in txIn');
        return false;
    } else {
        return true;
    }
};

const isValidTxOutStructure = (txOut: TxOut): boolean => {
    if (txOut == null) {
        console.log('txOut is null');
        return false;
    } else if (typeof txOut.nounce !== 'string') {
        console.log('invalid address type in txOut');
        return false;
    } else if (!isValidAddress(txOut.nounce)) {
        console.log('invalid TxOut address');
        return false;
    } 
    /*else if (typeof txOut.amount !== 'number') {
        console.log('invalid amount type in txOut');
        return false;
        
    }*/ 
    else {
        return true;
    }
};

const isValidTransactionStructure = (transaction: Transaction) => {
    if (typeof transaction.id !== 'string') {
        console.log('transactionId missing');
        return false;
    }
    if (!(transaction.txIns instanceof Array)) {
        console.log('invalid txIns type in transaction');
        return false;
    }
    if (!transaction.txIns
            .map(isValidTxInStructure)
            .reduce((a, b) => (a && b), true)) {
        return false;
    }

    if (!(transaction.txOuts instanceof Array)) {
        console.log('invalid txIns type in transaction');
        return false;
    }

    if (!transaction.txOuts
            .map(isValidTxOutStructure)
            .reduce((a, b) => (a && b), true)) {
        return false;
    }
    return true;
};

// valid address is a valid ecdsa public key in the 04 + X-coordinate + Y-coordinate format
const isValidAddress = (address: string): boolean => {
    /*
    if (address.length !== 130) {
        console.log(address);
        console.log('invalid public key length');
        return false;
    } else if (address.match('^[a-fA-F0-9]+$') === null) {
        console.log('public key must contain only hex characters');
        return false;
    } else if (!address.startsWith('04')) {
        console.log('public key must start with 04');
        return false;
    }
    */
    return true;
};

export {
    processTransactions, signTxIn, getTransactionId, isValidAddress, validateTransaction,
    UnspentTxOut, TxIn, TxOut, getCoinbaseTransaction, getPublicKey, hasDuplicates,
    Transaction, safeStringify
};
