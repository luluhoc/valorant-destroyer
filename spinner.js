const ora = require('ora');

const spinner = ora('Loading unicorns').start();

ora('Loading unicorns').start();
setTimeout(() => {
  spinner.color = 'yellow';
  spinner.text = 'Loading rainbows';
}, 2000);

spinner.stop();
