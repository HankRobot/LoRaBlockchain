import {PythonShell} from 'python-shell';
 
let options: any = {
  mode: 'text',
  pythonPath: 'C:/Users/Hank Bot/Anaconda3/python.exe',
  pythonOptions: ['-u'], // get print results in real-time
  //args: ['value1', 'value2', 'value3']
};
 
PythonShell.run('my_script.py', options, function (err, results) {
  if (err) throw err;
  // results is an array consisting of messages collected during execution
  console.log('results: %j\n', results);
});