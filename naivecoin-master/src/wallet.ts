import { ec } from 'elliptic';
import { existsSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import * as _ from 'lodash';
import { getPublicKey, getTransactionId, signTxIn, Transaction, TxIn, TxOut, UnspentTxOut, safeStringify } from './transaction';
import * as Pedersen from 'simple-js-pedersen-commitment'
import { Hasher } from './lib/hasher';
import { PrivateKey } from './lib/private-key';
import { PublicKey } from './lib/public-key';
import { Prng } from './lib/prng';
import { Signature } from './lib/signature';
import { getAccountBalance } from './blockchain';

import * as bigi from 'bigi'
import * as ecurve from 'ecurve'
import * as bitcoin from 'bitcoinjs-lib'
var secp256k1 = ecurve.getCurveByName('secp256k1')
var G = secp256k1.G
var n = secp256k1.n

// vG = (rG \+ sha256(e * dG)G)
function stealthDualSend(e, R, Q) {
    var eQ = Q.multiply(e) // shared secret
    var c = bigi.fromBuffer(bitcoin.crypto.sha256(eQ.getEncoded()))
    var cG = G.multiply(c)
    var vG = new bitcoin.ECPair(null, R.add(cG))

    return vG
}

// vG = (rG \+ sha256(eG * d)G)
function stealthDualScan(d, R, eG) {
    var eQ = eG.multiply(d) // shared secret
    var c = bigi.fromBuffer(bitcoin.crypto.sha256(eQ.getEncoded()))
    var cG = G.multiply(c)
    var vG = new bitcoin.ECPair(null, R.add(cG))

    return vG
}

// v = (r + sha256(eG * d))
function stealthDualReceive(d, r, eG) {
    var eQ = eG.multiply(d) // shared secret
    var c = bigi.fromBuffer(bitcoin.crypto.sha256(eQ.getEncoded()))
    var v = new bitcoin.ECPair(r.add(c).mod(n))

    return v
}

const dualkeystealthaddress = () => {
    // XXX: should be randomly generated, see next test for example
    var recipient: any = bitcoin.ECPair.fromWIF('5KYZdUEo39z3FPrtuX2QbbwGnNP5zTd7yyr2SC1j299sBCnWjss') // private to recipient
    var scan: any = bitcoin.ECPair.fromWIF('L5DkCk3xLLoGKncqKsWQTdaPSR4V8gzc14WVghysQGkdryRudjBM') // private to scanner/recipient
    var nonce: any = bitcoin.ECPair.fromWIF('KxVqB96pxbw1pokzQrZkQbLfVBjjHFfp2mFfEp8wuEyGenLFJhM9') // private to sender
    console.log("Receiver public keys", recipient.Q.toString());
    console.log("Receiver scan key", scan.Q.toString())
    // ... recipient reveals public key(s) (recipient.Q, scan.Q) to sender
    var forSender = stealthDualSend(nonce.d, recipient.Q, scan.Q)
    console.log("Transaction address", forSender.getAddress())
    //create the address for the receiver the check later, then the forrecipient will try to generate and check if its the same address


    //assert.throws(function () { forSender.toWIF() }, /Error: Missing private key/)

    // ... sender reveals nonce public key (nonce.Q) to scanner
    var forScanner = stealthDualScan(scan.d, recipient.Q, nonce.Q)
    //assert.throws(function () { forScanner.toWIF() }, /Error: Missing private key/)

    // ... scanner reveals relevant transaction + nonce public key (nonce.Q) to recipient

    var forRecipient = stealthDualReceive(scan.d, recipient.d, nonce.Q)
    if (forSender.getAddress() === forRecipient.getAddress()) {
        console.log("Use this private key for the money", forRecipient.toWIF());
    }
    //assert.doesNotThrow(function () { forRecipient.toWIF() })

    // scanner, sender and recipient, all derived same address
    console.log(forSender.getAddress() === forScanner.getAddress())
    console.log(forSender.getAddress() === forRecipient.getAddress())
}

//Pedersen Commitments are here
const PedersenCommitment = (amount: number): any => {
    const pederson = new Pedersen(
        '925f15d93a513b441a78826069b4580e3ee37fc5',
        '959144013c88c9782d5edd2d12f54885aa4ba687'
    );
    let secret = '1184c47884aeead9816654a63d4209d6e8e906e29';
    const commitment = pederson.commit(amount.toString(), secret)
    return [commitment, secret]
};

//ring signatures are here
const EC = new ec('secp256k1');
const privateKeyLocation = process.env.PRIVATE_KEY || 'node/wallet/private_key';
const privateKeyLocation1 = process.env.PRIVATE_KEY || 'node/wallet/private_key1';
const privateKeyLocation2 = process.env.PRIVATE_KEY || 'node/wallet/private_key2';
const privateKeyLocation3 = process.env.PRIVATE_KEY || 'node/wallet/private_key3';
const privateKeyLocation4 = process.env.PRIVATE_KEY || 'node/wallet/private_key4';

//All ring keys are written here
const getRingPrivateFromWallet = (): string[] => {
    const buffer = [readFileSync(privateKeyLocation1, 'utf8'),
    readFileSync(privateKeyLocation2, 'utf8'),
    readFileSync(privateKeyLocation3, 'utf8'),
    readFileSync(privateKeyLocation4, 'utf8')];
    return buffer;
};

const getRingPublicFromWallet = (): PublicKey[] => {
    const privateKey = getRingPrivateFromWallet();
    const hasher = new Hasher();
    const foreign_keys = [new PrivateKey(privateKey[1], hasher).public_key,
    new PrivateKey(privateKey[2], hasher).public_key,
    new PrivateKey(privateKey[3], hasher).public_key];
    //const key = EC.keyFromPrivate(privateKey, 'hex');
    //return key.getPublic().encode('hex');
    return foreign_keys;
};

const generateRingPrivateKey = (): PrivateKey => {
    //const keyPair = EC.genKeyPair();
    //const privateKey = keyPair.getPrivate();
    const privateKey = getRingPrivateFromWallet();
    const hasher = new Hasher();
    const key = new PrivateKey(privateKey, hasher);
    return key;
};

//Normal keys
const getPrivateFromWallet = (): string => {
    const buffer = readFileSync(privateKeyLocation, 'utf8');
    return buffer.toString();
};

const getPublicFromWallet = (): any => {
    /*
    const privateKey = getPrivateFromWallet();
    const key = EC.keyFromPrivate(privateKey, 'hex');
    return key.getPublic().encode('hex');
    */
    var recipient: any = bitcoin.ECPair.fromWIF('5KYZdUEo39z3FPrtuX2QbbwGnNP5zTd7yyr2SC1j299sBCnWjss') // private to recipient
    var scan: any = bitcoin.ECPair.fromWIF('L5DkCk3xLLoGKncqKsWQTdaPSR4V8gzc14WVghysQGkdryRudjBM') // private to scanner/recipient
    return [recipient.Q.getEncoded().toString('hex'), scan.Q.getEncoded().toString('hex'), recipient.d.toHex()];
};

const generatePrivateKey = (): string => {
    const keyPair = EC.genKeyPair();
    const privateKey = keyPair.getPrivate();
    return privateKey.toString(16);
};

const initWallet = () => {
    // let's not override existing private keys
    if (existsSync(privateKeyLocation)) {
        return;
    }

    const newPrivateKey = generatePrivateKey();

    writeFileSync(privateKeyLocation, newPrivateKey);
    console.log('new wallet with private key created to : %s', privateKeyLocation);
};

const deleteWallet = () => {
    if (existsSync(privateKeyLocation)) {
        unlinkSync(privateKeyLocation);
    }
};

const getBalance = (address: string, unspentTxOuts: UnspentTxOut[]): number => {
    return _(findUnspentTxOuts(address, unspentTxOuts))
        .map((uTxO: UnspentTxOut) => uTxO.amount)
        .sum();
};

const findUnspentTxOuts = (ownerAddress: string, unspentTxOuts: UnspentTxOut[]) => {
    const d = bigi.fromHex(getPublicFromWallet()[2]);
    const r = ecurve.Point.decodeFrom(secp256k1, Buffer.from(getPublicFromWallet()[0], "hex"));
    const eG = ecurve.Point.decodeFrom(secp256k1, Buffer.from(getPublicFromWallet()[1], "hex"));
    return _.filter(unspentTxOuts, (uTxO: UnspentTxOut) => uTxO.stealthaddress === stealthDualSend(d,r,eG).getAddress.toString());
};

const findTxOutsForAmount = (amount: number, myUnspentTxOuts: UnspentTxOut[]) => {
    const pederson = new Pedersen(
        '925f15d93a513b441a78826069b4580e3ee37fc5',
        '959144013c88c9782d5edd2d12f54885aa4ba687'
    )
    let pedersenamount:number = 0;
    let currentAmount = 0;
    const includedUnspentTxOuts = [];
    for (const myUnspentTxOut of myUnspentTxOuts) {
        includedUnspentTxOuts.push(myUnspentTxOut);
        while (!pederson.verify(pedersenamount.toString(), [myUnspentTxOut.pedersen], myUnspentTxOut.secret)) {
            pedersenamount++;
            console.log(pedersenamount);
        }
        currentAmount = currentAmount + pedersenamount;
        pedersenamount = 0;
        if (currentAmount >= amount) {
            const leftOverAmount = currentAmount - amount;
            return { includedUnspentTxOuts, leftOverAmount };
        }
    }

    const eMsg = 'Cannot create transaction from the available unspent transaction outputs.' +
        ' Required amount:' + amount;
    throw Error(eMsg);
};

const createTxOuts = (nonce: any, stealthaddress: string, amount, leftOverAmount: number) => {
    const txOut1: TxOut = new TxOut(nonce.Q.getEncoded().toString('hex'), stealthaddress, 0,
     PedersenCommitment(amount)[0], PedersenCommitment(amount)[1]);
    if (leftOverAmount === 0) {
        return [txOut1];
    } else {
        //create a stealth address for leftoveramount
        var forselfstealthaddress = stealthDualSend(bigi.fromHex(getPublicFromWallet()[2]),
            ecurve.Point.decodeFrom(secp256k1, Buffer.from(getPublicFromWallet()[0], "hex")),
            ecurve.Point.decodeFrom(secp256k1, Buffer.from(getPublicFromWallet()[1], "hex"))
        );
        const leftOverTx = new TxOut(getPublicFromWallet()[0], forselfstealthaddress.getAddress().toString(), 1,
         PedersenCommitment(leftOverAmount)[0], PedersenCommitment(leftOverAmount)[1]);
        return [txOut1, leftOverTx];
    }
};

const filterTxPoolTxs = (unspentTxOuts: UnspentTxOut[], transactionPool: Transaction[]): UnspentTxOut[] => {
    const txIns: TxIn[] = _(transactionPool)
        .map((tx: Transaction) => tx.txIns)
        .flatten()
        .value();
    const removable: UnspentTxOut[] = [];
    for (const unspentTxOut of unspentTxOuts) {
        const txIn = _.find(txIns, (aTxIn: TxIn) => {
            return aTxIn.txOutIndex === unspentTxOut.txOutIndex && aTxIn.txOutId === unspentTxOut.txOutId;
        });

        if (txIn === undefined) {

        } else {
            removable.push(unspentTxOut);
        }
    }

    return _.without(unspentTxOuts, ...removable);
};

const createTransaction = (receiverAddress: string, receiverScan: string, amount: number, privateKey: string,
    unspentTxOuts: UnspentTxOut[], txPool: Transaction[]): Transaction => {

    //console.log('txPool: %s', JSON.stringify(txPool));
    const d = bigi.fromHex(getPublicFromWallet()[2]);
    const r = ecurve.Point.decodeFrom(secp256k1, Buffer.from(getPublicFromWallet()[0], "hex"));
    const eG = ecurve.Point.decodeFrom(secp256k1, Buffer.from(getPublicFromWallet()[1], "hex"));
    const myUnspentTxOutsA = unspentTxOuts.filter((uTxO: UnspentTxOut) => uTxO.stealthaddress === stealthDualSend(d, r, eG).getAddress().toString());
    const myUnspentTxOuts = filterTxPoolTxs(myUnspentTxOutsA, txPool);

    // filter from unspentOutputs such inputs that are referenced in pool
    const { includedUnspentTxOuts, leftOverAmount } = findTxOutsForAmount(amount, myUnspentTxOuts);
    const toUnsignedTxIn = (unspentTxOut: UnspentTxOut) => {
        const txIn: TxIn = new TxIn();
        txIn.txOutId = unspentTxOut.txOutId;
        txIn.txOutIndex = unspentTxOut.txOutIndex;
        return txIn;
    };

    const unsignedTxIns: TxIn[] = includedUnspentTxOuts.map(toUnsignedTxIn);

    // filter from unspentOutputs such inputs that are referenced in pool
    //const leftOverAmount = findTxOutsForAmount(amount);
    //const unsignedTxIns: TxIn[] = [];

    const tx: Transaction = new Transaction();
    const foreign_keys = getRingPublicFromWallet();
    tx.txIns = unsignedTxIns;

    //Retrieve receiver public and scan key
    var receiver = ecurve.Point.decodeFrom(secp256k1, Buffer.from(receiverAddress, "hex"));
    var scan = ecurve.Point.decodeFrom(secp256k1, Buffer.from(receiverScan, "hex"));

    //generate Stealth Address
    var nonce: any = bitcoin.ECPair.fromWIF('KxVqB96pxbw1pokzQrZkQbLfVBjjHFfp2mFfEp8wuEyGenLFJhM9') // private to sender
    var forSender = stealthDualSend(nonce.d, receiver, scan)
    tx.txOuts = createTxOuts(nonce, forSender.getAddress().toString(), amount, leftOverAmount);
    tx.id = getTransactionId(tx);

    tx.txIns = tx.txIns.map((txIn: TxIn, index: number) => {
        txIn.signature = signTxIn(tx, index, foreign_keys, unspentTxOuts);
        txIn.signaturestring = txIn.signature.getc_summation();
        return txIn;
    });
    
    return tx;
};

export {
    createTransaction, getPublicFromWallet,
    getPrivateFromWallet, getBalance, generatePrivateKey, initWallet, deleteWallet, findUnspentTxOuts,
    getRingPrivateFromWallet, getRingPublicFromWallet, generateRingPrivateKey, PedersenCommitment, dualkeystealthaddress, stealthDualSend
};