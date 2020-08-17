import {PythonShell} from 'python-shell';
import * as Pedersen from 'simple-js-pedersen-commitment'
 
let options: any = {
  mode: 'text',
  pythonPath: 'C:/Users/Hank Bot/Anaconda3/python.exe',
  pythonOptions: ['-u'], // get print results in real-time
  args: ['1']
};
 
let v : any;
let b : any;
let c : any;

PythonShell.run('my_script.py', options, function (err, results) {
  if (err) throw err;
  console.log(results)
});

let pederson = new Pedersen(
  '925f15d93a513b441a78826069b4580e3ee37fc5',
  '959144013c88c9782d5edd2d12f54885aa4ba687'
)
let pedersenlist:Array<any> = [];
let secret = '1184c47884aeead9816654a63d4209d6e8e906e29'

const testA = pederson.commit('1', secret, 'e93c58e6f7f3f4b6f6f0e55f3a4191b87d58b7b1')
pederson = new Pedersen(
  '925f15d93a513b441a78826069b4580e3ee37fc5',
  '959144013c88c9782d5edd2d12f54885aa4ba687'
)
const testB = pederson.commit('2', secret, 'ba1303c4f29bd959f585dc0dcfb3dbd0cebecd48')
pedersenlist.push(testA)
pedersenlist.push(testB)

console.log(pederson.verify('3', [pederson.combine(pedersenlist)], secret))