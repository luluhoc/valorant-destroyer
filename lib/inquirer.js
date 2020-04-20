
const inquirer = require('inquirer');

const mapToDb = require('./mapToDb');


module.exports = {
  checkIfAccounts: () => {
    const questions = [
      {
        name: 'accounts',
        type: 'confirm',
        message: 'Do the file accounts.txt is saved and filled with accounts?',
        default: true,
      },
    ];
    return inquirer.prompt(questions);
  },
  dbQuestion: () => {
    const questions = [
      {
        name: 'map',
        type: 'confirm',
        message: 'Do you want to map users to DB (required on first run) it will delete all previous not validated accounts?',
        default: true,
      },
    ];
    return inquirer.prompt(questions);
  },
  menu: () => {
    const questions = [
      {
        name: 'action',
        type: 'list',
        message: 'What do you want to do? Keep in mind that check credentials is recommended!',
        choices: ['Verify Credentials', 'Verify Game Access'],
        validate(value) {
          if (value.length) {
            return true;
          }
          return 'Please enter your password.';
        },
      },
    ];
    return inquirer.prompt(questions);
  },
};
