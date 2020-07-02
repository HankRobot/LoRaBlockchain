pragma solidity ^0.5.12;

contract LoRa{
    

    struct  sensor{
        uint sensorId;
        uint[] temperature;
        uint[] stress;
        uint[] time;
        uint count;
        bytes32[] blockhash;
    }
    
    mapping (uint => sensor) private sensors;
    
    
    
    
    function setInput (uint _sensorId, uint _temperature, uint _stress) public{
        sensors[_sensorId].sensorId=_sensorId;
        sensors[_sensorId].temperature.push(_temperature);
        sensors[_sensorId].stress.push(_stress);
        sensors[_sensorId].time.push(block.timestamp);
        sensors[_sensorId].count++;
       // sensors[_sensorId]=sensor(_sensorId, sensor.push(_temperature), sensor.push(_stress));
       // sensors[_sensorId]=sensor(_sensorId,_temperature, _stress);
    }
    
     
    function getOutput (uint _sensorId) public view returns (uint[] memory, uint[] memory, uint[] memory, uint, bytes32[] memory)
    {
       
        return (sensors[_sensorId].temperature, sensors[_sensorId].stress, sensors[_sensorId].time,
         sensors[_sensorId].count, sensors[_sensorId].blockhash);
        
    }
    
    function setHash (uint _sensorId, bytes32  _hash) public
    {
        sensors[_sensorId].blockhash.push(_hash);
    }

}
