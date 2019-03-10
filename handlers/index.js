const {
  getTextContentFromElement,
  getAndWriteVideo,
  slugify,
} = require('../utils');

/**
 * Make login
 * @param {Object} page
 * @returns {Object}
 */
exports.login = async ({ page, email, password }) => {
  const LOGIN_FRAME_URL = 'https://www.linkedin.com/uas/login?fromSignIn=true&trk=learning&_l=en_US&uno_session_redirect=%2Flearning%2F&session_redirect=%2Flearning%2FloginRedirect.html&is_enterprise_authed=';

  await page.goto('https://www.linkedin.com/learning/login');
  await page.waitFor(1000);

  /**
   * Linkedin learning page open login's
   * page inside an iframe tag
   */
  const frames = await page.mainFrame().childFrames();
  const loginFrame = frames.find(frame => {
    if (frame.url() === LOGIN_FRAME_URL) return frame;
  });

  await loginFrame.type('#session_key-login', email);
  await loginFrame.type('#session_password-login', password);
  await loginFrame.click('#btn-primary');
  await loginFrame.waitFor(3000);

  return loginFrame;
};

/**
 * Map video urls and the course summary
 * @param {Object} page
 * @param {String} url
 * @returns {Array}
 */
exports.mapVideoUrlsAndSummary = async ({ page, url }) => {
  await page.goto(url);
  await page.waitFor(2000);
  await page.click('.course-body__info-tab-name.course-body__info-tab-name-content.ember-view');
  await page.waitFor(2000);
  const course = await page.$('.course-banner__headline.t-24.t-bold.t-white')
  const courseName = await getTextContentFromElement({ page, elem: course });
  const courseList = await page.$('.course-toc__list');
  const courseChapters = await courseList.$$('.course-chapter.ember-view');

  const videoUrlsAndSummary = await courseChapters.map(async item => {
    const video = {};
    const sectionTitle = await item.$('.course-chapter__title-text.t-16.t-bold');
    const sectionTitleValue = await getTextContentFromElement({ page, elem: sectionTitle });
    const sectionClasses = await item.$$('.video-item.ember-view');

    const classes = await sectionClasses.map(async classItem => {
      const link = await classItem.$('.toc-item');
      const linkValue = await page.evaluate(element => element.getAttribute('href'), link);
      const labelElem = await classItem.$('.toc-item__content.t-14.t-black.t-normal')
      return {
        label: await getTextContentFromElement({ page, elem: labelElem }),
        link: `https://www.linkedin.com${linkValue}`,
      };
    });

    video.title = sectionTitleValue;
    video.classes = await Promise.all(classes);
    return video;
  });

  const structure = await Promise.all(videoUrlsAndSummary);
  return { courseName, structure };
};

exports.downloadVideos = async ({ page, courseStructure }) => new Promise(async resolve => {
  const currentWorkingDirectory = process.cwd();
  const pathWithNamespace = `${currentWorkingDirectory}/${slugify(courseStructure.courseName)}`;
  const { structure } = courseStructure;
  const structureLength = structure.length;

  for (let index = 0; index < structureLength; index++) {
    const item = structure[index];
    const pathWithTitle = `${pathWithNamespace}/${slugify(item.title)}`;
    const classesLength = item.classes.length;
    
    for (let clsIndex = 0; clsIndex < classesLength; clsIndex++) {
      const c = item.classes[clsIndex];
      await page.goto(c.link);
      await page.waitFor(2000);
      const videoElem = await page.$('.vjs-tech');
      const videoSourceUrl = await page.evaluate(element => element.getAttribute('src'), videoElem);
      console.log(`* Downloading \`${slugify(c.label)}\``);
      getAndWriteVideo({
        path: `${pathWithTitle}/${slugify(c.label)}.mp4`,
        url: videoSourceUrl,
      });
    }
  }

  return resolve();
});