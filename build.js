/* Įrašo meistrų korteles iš masters.js į index.html tarp žymų <!-- masters:<kryptis> --> … <!-- /masters -->,
   kad puslapis būtų pilnas ir be JavaScript. Paleisti: node build.js */
const fs = require('fs');
const path = require('path');
const I = require('./masters.js').IMPRESS;
const file = path.join(__dirname, 'index.html');
let html = fs.readFileSync(file, 'utf8');
let n = 0;
html = html.replace(/(<!-- masters:([a-z]+) -->)[\s\S]*?(<!-- \/masters -->)/g, (all, open, dir, close) => {
  n++;
  return open + '\n' + I.renderGroup(dir) + '\n' + close;
});
fs.writeFileSync(file, html);
console.log('masters rendered: ' + n + ' groups');
