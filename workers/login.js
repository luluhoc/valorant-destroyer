const ora = require('ora');

const axios = require('axios').default;
const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const workerpool = require('workerpool');
const { nanoid } = require('nanoid');


const getCookies = async function getCookies() {
  const url = 'https://auth.riotgames.com/login#client_id=play-valorant-web-prod&nonce=NTQsMTA3LDI1MSwx&prompt=login&redirect_uri=https%3A%2F%2Fbeta.playvalorant.com%2Fopt_in&response_type=token%20id_token&scope=account%20openid&state=bG9naW4%3D&ui_locales=en-us';
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  });
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (
      request.resourceType() === 'image'
      || request.resourceType() === 'video'
    ) request.abort();
    else request.continue();
  });
  await page.goto(url);

  await page.waitForSelector('input[name="password"]');
  const cookies = await page.cookies();

  const cookieData = cookies
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join('; ');

  const cookiesPath = `./lib/cookies/cookies${nanoid()}.txt`;
  fs.writeFileSync(cookiesPath, cookieData);
  await browser.close();
  return {
    cookies: cookiesPath,
  };
};


const login = async (account) => {
  const post = 'https://auth.riotgames.com/api/v1/authorization';
  const pupRes = await getCookies();
  const { cookies } = pupRes;
  const acc = account;
  try {
    const response = await axios.default.put(
      post,
      {
        type: 'auth',
        username: account.login,
        password: account.password,
        remember: false,
        language: 'en_US',
      },
      {
        withCredentials: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          Cookie: fs.readFileSync(cookies).toString(),
        },
        followAllRedirects: true,
        method: 'PUT',
      },
    );
    if (response.data.error === 'auth_failure') {
      await fs.remove(cookies);
      acc.error = true;
      acc.reason = response.data.error;
      return {
        account: acc,
      };
    }

    if (response.data.error === 'rate_limited') {
      await fs.remove(cookies);
      acc.error = true;
      acc.reason = response.data.error;
      return {
        account: acc,
      };
    }

    const token = response.data.response.parameters.uri.split('#')[1].split('=')[0];
    if (token === 'access_token') {
      await fs.remove(cookies);
      acc.error = false;
      acc.success = true;
      acc.reason = response.statusText;
      return {
        account: acc,
      };
    }
  } catch (error) {
    await fs.remove(cookies);
    console.log(error);
    console.error(error);
    if (error.response.status === 500) {
      acc.error = true;
      acc.reason = error.response.data.error;
      return {
        account: acc,
      };
    }
  }
};


workerpool.worker({
  login,
});
