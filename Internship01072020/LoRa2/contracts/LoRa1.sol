pragma solidity ^0.5.12;

contract LoRa{
    struct sensor{
        uint sensorId;
        uint[] temperature;
        uint[] stress;
        uint[] time;
        uint count;
    }
    mapping (uint => sensor) private sensors;

    function setInput (uint _sensorId, uint _temperature, uint _stress) public{
        sensors[_sensorId].sensorId=_sensorId;
        sensors[_sensorId].temperature.push(_temperature);
        sensors[_sensorId].stress.push(_stress);
        sensors[_sensorId].time.push(block.timestamp);
        sensors[_sensorId].count++;
    }

    function getOutput (uint _sensorId) public view returns (uint[] memory, uint[] memory, uint[] memory, uint)
    {
        return (sensors[_sensorId].temperature, sensors[_sensorId].stress, sensors[_sensorId].time,
         sensors[_sensorId].count);
    }
}
