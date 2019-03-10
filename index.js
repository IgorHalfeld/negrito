const puppeteer = require('puppeteer');
const { createDirectoryStructure } = require('./utils');
const {
  login,
  mapVideoUrlsAndSummary,
  downloadVideos,
} = require('./handlers');
const {
  email,
  password,
  url,
} = require('./configs');

const DEFAULT_OPTS = { headless: false, defaultViewport: { width: 1366, height: 1080 } };
(async () => {
  const browser = await puppeteer.launch(DEFAULT_OPTS);
  const page = await browser.newPage();

  await login({ page, email, password });
  console.log(`* User ${email} logged`);
  const videoUrlsAndSummary = await mapVideoUrlsAndSummary({ page, url });
  await createDirectoryStructure(videoUrlsAndSummary);
  console.log(`* Course folder structure was created`);
  console.log('* Starting download...');
  await downloadVideos({ page, courseStructure: videoUrlsAndSummary });

  console.log('* Done!');
  await browser.close();
})();