<template>
  <div>
    <h3>Transaction</h3>
    <h4>{{ transaction.id }}</h4>
    <h4>Total amount: {{ totalValue(transaction) }}</h4>
    <h5>TxIns</h5>
    <div class="txIn break-word" v-for="txIn in transaction.txIns">
      <div class="row bold" v-if="txIn.signaturestring ===''">Coinbase transaction</div>
      <div class="row">TxOutId: <router-link :to="{ name: 'Transaction', params: {id: txIn.txOutId }}"> <span>{{ txIn.txOutId }}</span></router-link></div>
      <div class="row">TxOutIndex:  {{ txIn.txOutIndex }}</div>
      <div class="row">Signature String: {{ txIn.signaturestring }}</div>
      <button v-on:click="isHidden = !isHidden">Show full Signature</button>
      <div v-if="!isHidden" class="row">Signature: {{ txIn.signature }}</div>
    </div>
    <h5>TxOuts</h5>
    <div class="txIn break-word" v-for="txOut in transaction.txOuts">
      <div class="row">Stealth Address: <router-link :to="{ name: 'Address', params: {address: txOut.stealthadd}}"> <span>{{ txOut.stealthadd }}</span></router-link> </div>
      <div class="row">Sender Nounce: {{ txOut.nounce}}</div>
      <div class="row">Amount: {{ txOut.amount}}</div>
      <div class="row">Pedersen: {{ txOut.pedersen}}</div>
      <div class="row">Secret: {{ txOut.secret}}</div>
    </div>
  </div>
</template>


<script>
  export default {
    name: 'Transaction',
    data() {
      return {
        isHidden: false,
        transaction :{}
      }
    },
    created() {
      this.getTransaction(this.$route.params.id)
    },
    update() {
      console.log('update')
    },
    methods: {
      getTransaction: function (id) {
          console.log('tsers')
        this.$http.get('/api/transaction/' + id)
          .then(resp => {
            this.transaction = resp.data;
          })
      },
      trimAddress: function(address) {
        return address.substr(0,24) + '...';
      },
      totalValue: function(transaction) {
        return _(transaction.txOuts)
          .map(txOut => txOut.amount)
          .sum()
      }
    }
  }
</script>

<style scoped>
.bold {
  font-weight: bold;
}

.txIn {
  padding: 1em;
  margin-bottom: 1em;
  background-color: gainsboro;
}
</style>
