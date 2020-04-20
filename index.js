const Ora = require('ora');

const chalk = require('chalk');
const clear = require('clear');
const figlet = require('figlet');
const workerpool = require('workerpool');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const cliSpinners = require('cli-spinners');
const inquirer = require('./lib/inquirer');


const adapter = new FileSync('accounts.json');

const db = low(adapter);

db.defaults({ accounts: [], count: 0 }).write();

const pool = workerpool.pool('./workers/worker.js');

const pool2 = workerpool.pool('./workers/login.js');

clear();

console.log(
  chalk.blue(
    figlet.textSync('Val Destroyer', { horizontalLayout: 'full' }),
  ),
);

const run = async () => {
  const ac = await inquirer.checkIfAccounts();
  if (!ac.accounts) {
    return console.log('Please fill up accounts.txt with data before continuing!');
  }
  const mapQuestion = await inquirer.dbQuestion();
  if (mapQuestion) {
    const spinner = Ora('Mapping Accounts to DB');
    spinner.start();
    let workerData;
    try {
      const worker = await pool.proxy();
      workerData = await worker.mapToDb();
    } catch (error) {
      console.error(error);
    } finally {
      spinner.stop();
    }
  }

  const menu = await inquirer.menu();

  if (menu.action === 'Verify Credentials') {
    const accounts = await db.get('accounts').value();
    const promises = [];
    for (let i = 0; i < accounts.length; i++) {
      const e = accounts[i];
      console.log(`Verifying account ${e.login}`);
      let workerData;
      try {
        const workerLogin = await pool2.proxy();
        promises.push(workerLogin.login(e));
      } catch (error) {
        console.error(error);
      }
    }
    const spinner = new Ora({
      spinner: 'moon',
      text: 'Waiting for workers to finish\n',
    });
    spinner.start();
    const resolved = await Promise.all(promises);
    spinner.stop();
    const spinner2 = new Ora({
      spinner: 'bouncingBar',
      text: 'Reworking responses from riot to DB\n',
    });
    spinner2.start();
    const newArray = resolved.map((r) => r.account);
    for (let i = 0; i < newArray.length; i += 1) {
      const e = newArray[i];
      db.get('accounts')
        .find({ id: e.id })
        .assign({ ...e })
        .write();
    }
    // spinner2.stop();
  }
};

run();
