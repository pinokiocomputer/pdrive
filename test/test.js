const path = require('path')
const git = require("isomorphic-git")
const http = require('isomorphic-git/http/node')
const fs = require("fs")
const Pdrive = require("../index")
const drivePath = path.resolve(__dirname, "drive")
const appPath = path.resolve(__dirname, "app")
const drive = new Pdrive(drivePath);
(async () => {
  // create folder

  await git.clone({
    fs,
    http,
    dir: path.resolve("apps/ComfyUI"),
    url: 'https://github.com/comfyanonymous/ComfyUI',
    singleBranch: true,
    depth: 1
  })

  const checkpointsPath = path.resolve("apps/ComfyUI/models/checkpoints")
  await drive.create({
    uri: "https://github.com/cocktailpeanut/comfyui.git",
    interface: {
      "models/checkpoints": checkpointsPath
    },
    peers: ["https://github.com/cocktailpeanut/automatic1111.git"]
  })

  const testPath = path.resolve(checkpointsPath, "test.txt")
  await fs.promises.writeFile(testPath, "THIS IS A TEST")
})();
