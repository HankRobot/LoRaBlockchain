<template>
  <div v-if="block.hash">

    <h3>Block #{{ block.index }}</h3>
    <table>
      <tbody>
      <tr>
        <td>Hash</td>
        <td>{{ block.hash }}</td>
      </tr>
      <tr>
        <td>Previous hash</td>
        <td>{{ block.previousHash}}</td>
      </tr>
      <tr>
        <td>Timestamp</td>
        <td>{{ block.timestamp}}</td>
      </tr>
      <tr>
        <td>Difficulty</td>
        <td>{{ block.difficulty}}</td>
      </tr>
      <tr>
        <td>Nonce</td>
        <td>{{ block.nonce}}</td>
      </tr>
      <tr>
        <td>Number of transactions</td>
        <td>{{ block.data.length}}</td>
      </tr>

      </tbody>
    </table>
    <h3>Transactions</h3>
    <div class="transaction" v-for="tx in block.data">
      <div class="row">
        <span>Transaction Id -> </span>
        <router-link :to="{ name: 'Transaction', params: { id: tx.id }}"> <span >{{ tx.id }}</span></router-link>

      </div>
      <div class="row">
        <div class="five columns">
          <div v-for="txIn in tx.txIns">
            <div v-if="txIn.signaturestring === ''">coinbase</div>
            <div class="break-word" v-else>
              <div class="row">TxOutId: {{ txIn.txOutId}}</div>
              <div class="row">TxOutIndex: {{ txIn.txOutIndex}}</div>
              <div class="row">Signature: {{ txIn.signaturestring}}</div>
            </div>
          </div>
        </div>
        <div class="one columns">
          ->
        </div>
        <div class="six columns">
          <div class="row" v-for="txOut in tx.txOuts">
            <div class="break-word">
              <span>Stealth Address: </span>
              <router-link :to="{ name: 'Stealth Address', params: { id: txOut.stealthadd }}"> <span >{{ txOut.stealthadd }}</span></router-link>
              <div class="row">Sender Nounce: {{ txOut.nounce}}</div>
              <div class="row">Amount: {{ txOut.amount}}</div>
              <div class="row">Pedersen: {{ txOut.pedersen}}</div>
              <div class="row">Secret: {{ txOut.secret}}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  export default {
    name: 'Block',
    data() {
      return {
        block :{}
      }
    },
    created() {
      this.getBlock(this.$route.params.id)
    },
    methods: {
      getBlock: function (hash) {
        this.$http.get('/api/block/' + hash)
          .then(resp => {
            this.block = resp.data;
          })
      },
      trimAddress: function(address) {
        return address.substr(0,24) + '...';
      }
    }
  }
</script>

<style scoped>
  .transaction {
    padding: 1em;
    margin-bottom: 1em;
    background-color: gainsboro;
  }
</style>
