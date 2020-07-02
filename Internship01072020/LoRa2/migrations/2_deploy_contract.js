const LoRa = artifacts.require("LoRa");

module.exports = function(deployer) {
  deployer.deploy(LoRa);
};
