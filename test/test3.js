const path = require('path')
const fs = require("fs");
(async () => {
  // create folder
  const appPath = path.resolve(__dirname, "app")
  await fs.promises.writeFile(path.resolve(appPath, "ComfyUI/models/test.txt"), "THIS IS NOT A TEST")
})();
