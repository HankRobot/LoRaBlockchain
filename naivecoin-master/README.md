# Naivecoin

The repository for the naivecoin tutorial: https://lhartikk.github.io/

```
npm install
npm start
```

##### Get blockchain
```
curl http://localhost:3001/blocks
```

##### Mine a block
```
curl -X POST http://localhost:3001/mineBlock
``` 

remove-item alias:\curl

##### Send transaction
```
curl -H "Content-type: application/json" --data '{"address": "048965ac9854dcd29be590a2ec59db7de355fc99729e99090bc17143af68732cdd4d81d5e1d1d00449264e4b44538f91e7c66b4c58ee5485fd7118fbbf2a21aea9", "amount" : 35}' http://localhost:3001/sendTransaction
```

##### Query transaction pool
```
curl http://localhost:3001/transactionPool
```

##### Mine transaction
```
curl -H "Content-type: application/json" --data '{"address": "048965ac9854dcd29be590a2ec59db7de355fc99729e99090bc17143af68732cdd4d81d5e1d1d00449264e4b44538f91e7c66b4c58ee5485fd7118fbbf2a21aea9", "amount" : 35}' http://localhost:3001/mineTransaction
```

##### Get balance
```
curl http://localhost:3001/balance
```

#### Query information about a specific address
```
curl http://localhost:3001/address/04bfcab8722991ae774db48f934ca79cfb7dd991229153b9f732ba5334aafcd8e7266e47076996b55a14bf9913ee3145ce0cfc1372ada8ada74bd287450313534a
```

##### Add peer
```
curl -H "Content-type:application/json" --data '{"peer" : "ws://localhost:6001"}' http://localhost:3001/addPeer
```
#### Query connected peers
```
curl http://localhost:3001/peers
```
