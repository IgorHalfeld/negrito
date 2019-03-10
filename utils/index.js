const https = require('https');
const { promisify } = require('util');
const {
  mkdir,
  createWriteStream,
} = require('fs');

const mkdirPromised = promisify(mkdir);

const slugify = input => input
  .toString()
  .toLowerCase()
  .replace(/[áãâà]/gi, 'a')
  .replace(/[éê]/gi, 'e')
  .replace(/í/gi, 'i')
  .replace(/[óõ]/gi, 'o')
  .replace(/ú/gi, 'u')
  .replace(/ñ/gi, 'n')
  .replace(/ç/g, 'c')
  .replace(/[\s_]+/g, '-')
  .replace(/[^\w-]+/g, '')
  .replace(/-+/g, '-')
  .replace(/^-+/, '')
  .replace(/-+$/, '');
exports.slugify = slugify;

exports.getTextContentFromElement = ({ page, elem }) =>
  page.evaluate(element => element.textContent, elem);

exports.createDirectoryStructure = async courseStructure => {
  const { structure } = courseStructure;
  if (!Array.isArray(structure)) return;
  const currentWorkingDirectory = process.cwd();
  const structureLength = structure.length;
  
  const pathWithNamespace = `${currentWorkingDirectory}/${slugify(courseStructure.courseName)}`;
  await mkdirPromised(pathWithNamespace);

  for (let index = 0; index < structureLength; index++) {
    const item = structure[index];
    const pathWithTitle = `${pathWithNamespace}/${slugify(item.title)}`;
    await mkdirPromised(pathWithTitle);
  }

  return Promise.resolve();
};

exports.getAndWriteVideo = ({ url, path }) => {
  const file = createWriteStream(path);
  https.get(url, response => response.pipe(file));
};