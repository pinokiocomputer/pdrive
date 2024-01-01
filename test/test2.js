const path = require('path')
const git = require("isomorphic-git")
const http = require('isomorphic-git/http/node')
const fs = require("fs")
const Pdrive = require("../index")
const drivePath = path.resolve(__dirname, "drive")
const drive = new Pdrive(drivePath);
(async () => {
  // create folder
  await git.clone({
    fs,
    http,
    dir: path.resolve("apps/stable-diffusion-webui"),
    url: 'https://github.com/AUTOMATIC1111/stable-diffusion-webui',
    singleBranch: true,
    depth: 1
  })

  const checkpointsPath = path.resolve("apps/stable-diffusion-webui/models/Stable-diffusion")
  const loraPath = [
    path.resolve("apps/stable-diffusion-webui/models/Lora"),
    path.resolve("apps/stable-diffusion-webui/models/LyCORIS"),
  ]
  await drive.create({
    uri: 'https://github.com/AUTOMATIC1111/stable-diffusion-webui.git',
    interface: {
      "models/checkpoints": checkpointsPath,
      "models/lora": loraPath,
    },
    peers: ["https://github.com/cocktailpeanut/comfyui.git"],
  })

  const testPath = path.resolve(checkpointsPath, "test.txt")
  const test2Path = path.resolve(loraPath[0], "test.txt")
  const test3Path = path.resolve(loraPath[1], "test2.txt")
  await fs.promises.writeFile(testPath, "THIS IS A TEST 3")
  await fs.promises.writeFile(test2Path, "THIS IS A LORA TEST")
  await fs.promises.writeFile(test3Path, "THIS IS A LyCORIS TEST")
})();
