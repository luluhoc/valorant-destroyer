const fs = require('fs-extra');
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const shortid = require('shortid');
const workerpool = require('workerpool');


const adapter = new FileSync('accounts.json');

const db = low(adapter);

db.defaults({ accounts: [], count: 0 }).write();

const readFile = async (file) => {
  const data = await fs.readFile(file);
  return data.toString('utf8');
};

const createArr = async () => {
  const data = await readFile('accounts.txt');
  const array = data.split('\n');
  const finalArr = [];
  for (let i = 0; i < array.length; i++) {
    const element = array[i];
    const tempArr = element.split(':');
    finalArr.push({
      login: tempArr[0],
      password: tempArr[1],
    });
  }
  return finalArr;
};

const mapToDb = async () => {
  try {
    await db.set('accounts', []).write();
    await db.set('count', 0).write();
    const accounts = await createArr();
    for (let i = 0; i < accounts.length; i++) {
      const e = accounts[i];
      db.update('count', (n) => n + 1).write();
      db.get('accounts')
        .push({
          id: shortid.generate(), login: e.login, password: e.password,
        })
        .write();
    }
    return { success: true };
  } catch (error) {
    console.log(error);
  }
};

workerpool.worker({
  mapToDb,
});
