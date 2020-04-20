const axios = require('axios').default;
const puppeteer = require('puppeteer');
const fs = require('fs-extra');


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

  fs.writeFileSync('./lib/cookies/cookies.txt', cookieData);
  await browser.close();
};


const main = async (username, password) => {
  const post = 'https://auth.riotgames.com/api/v1/authorization';
  console.time('Get');
  await getCookies();
  try {
    const response = await axios.default.put(
      post,
      {
        type: 'auth',
        username,
        password,
        remember: false,
        language: 'en_US',
      },
      {
        withCredentials: true,
        headers: {
          'Access-Control-Allow-Origin': '*',
          Cookie: fs.readFileSync('./lib/cookies/cookies.txt').toString(),
        },
        followAllRedirects: true,
        method: 'PUT',
      },
    );
    console.log(response);
    if (response.data.error === 'auth_failure') {
      return {
        reason: 'auth_failure',
        error: true,
      };
    }

    if (response.data.error === 'rate_limited') {
      return {
        reason: 'rate_limited',
        error: true,
      };
    }

    console.timeEnd('Get');
    const token = response.data.response.parameters.uri.split('#')[1].split('=')[0];
    console.log(token);
    if (token === 'access_token') {
      return {
        success: true,
      };
    }
  } catch (error) {
    console.error(error);
  }
};

module.exports = main;
