const Pdrive = require("../index")
const path = require('path')
const fs = require('fs')
const drivePath = path.resolve(__dirname, "drive")
const git = require('isomorphic-git')
const http = require('isomorphic-git/http/node')
const drive = new Pdrive(drivePath);
(async () => {
  await git.clone({
    fs,
    http,
    dir: path.resolve("deusdir"),
    url: 'https://github.com/cocktailpeanut/deus',
    singleBranch: true,
    depth: 1
  })
  let r = await drive.resolve(path.resolve("deusdir", "client/app"))
  console.log(r)
})();
