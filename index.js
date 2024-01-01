/*******************************
* 
*   /homedir
*     interface.json
*     /drives
*       /<drive>
*       /<drive>
*       /<drive>
*       /<drive>
*       /<drive>
* 
*******************************/
const fs = require('fs')
const path = require('path')
const symlinkDir = require('symlink-dir')
class Pdrive {
  constructor(home) {
    /******************************************
    *
    *   const drive = new Pdrive(drive_dir)
    *
    ******************************************/
    this.home = home
  }
  async create(params) {
    /**************************************************************************************************************************
    *
    *   # SYNTAX
    *
    *   ```
    *   await drive.create(LINK_PATH, {
    *     uri: DRIVE_GIT_URL,
    *     path: DRIVE_PATH,
    *     peers: [ PEER_DRIVE_GIT_URL,... ],
    *   })
    *   await drive.create({
    *     uri: DRIVE_GIT_URL,
    *     interface: {
    *       DRIVE_PATH: LINK_PATH,
    *       DRIVE_PATH: LINK_PATH,
    *       DRIVE_PATH: LINK_PATH,
    *     },
    *     peers: [ PEER_DRIVE_GIT_URL,... ],
    *   })
    *   ```
    *
    *   - LINK_PATH: the symlink path(s) to create, which will point to the resolved (or created) virtual drive
    *   - DRIVE_PATH: The file path within the virtual drive. The LINK_PATH will point to the resolved DRIVE_PATH
    *   - DRIVE_GIT_URL: The git url for the virtual drive
    *   - PEER_DRIVE_GIT_URL: Other git URLs shared with the current DRIVE
    *
    *   # What it does
    *
    *   # Example:
    *   // link a single path to an interface
    *   await drive.create({
    *     uri: "https://github.com/comfyanonymous/ComfyUI.git",
    *     interface: {
    *       vae: path.resolve("apps/models/vae")
    *     },
    *     peers: [ "https://github.com/automatic1111/stable-diffusion-webui.git" ]
    *   })
    *
    *   // link multiple paths to a single interface
    *   await drive.create({
    *     uri: "https://github.com/comfyanonymous/ComfyUI.git",
    *     interface: {
    *       lora: [
    *         path.resolve("apps/comfyui/app/models/LORA"),
    *         path.resolve("apps/comfyui/app/models/LyCORIS"),
    *       ]
    *     },
    *     peers: [ "https://github.com/automatic1111/stable-diffusion-webui.git" ]
    *   })
    *
    **************************************************************************************************************************/

    // 1. create interface.json if it doesn't exist
    let configPath = path.resolve(this.home, "interface.json")
    let exists = await fs.promises.access(configPath).then(() => true).catch(() => false);
    if (!exists) {
      let drive_exists = await fs.promises.access(this.home).then(() => true).catch(() => false);
      if (!drive_exists) {
        await fs.promises.mkdir(this.home, { recursive: true })
      }
      await fs.promises.writeFile(configPath, JSON.stringify({}), "utf8") 
    }

    // 2. load interface.json
    //
    //    interface.json := {
    //      "https://github.com/cocktailpeanut/comfyui.git": {
    //        "app/models": "A"
    //      },
    //      "https://github.com/cocktailpeanut/sd-webui.git": {
    //        "app/models/Stable-diffusion": "A"
    //      }
    //    }
    let config
    try {
      let configStr = await fs.promises.readFile(configPath, "utf8")
      config = JSON.parse(configStr)
    } catch (e) {
      config = {}
    }

    // 3. look for existence of peers
    //    => if one of the declared peers already exists in the interface.json, use that drive
    //    => if no peers, generate a drive from scratch



    for(const route in params.interface) {

      // drive => points to the absolute path of the actual path the drive at route is stored


      let peers = (params.peers ? params.peers : []).concat(params.uri)

      // get a drive path that matches the condition
      // if not, create one and return
      let drive = await this.getDrive(route, config, peers)

      // 4. Create a symbolic link

      // iterate through all links and symlink
      let links = params.interface[route] 
      if (!Array.isArray(links)) {
        links = [links]
      }
      for(let link of links) {
        const result = await symlinkDir(drive, link)
        console.log("symlink", result)
      }

      // 5. Update interface.json
      if (config[params.uri]) {
        config[params.uri][route] = drive
      } else {
        config[params.uri] = {
          [route]: drive
        }
      }
      await fs.promises.writeFile(configPath, JSON.stringify(config, null, 2), "utf8")
    }
    
  }
  async getDrive(route, config, peers) {
    // check if one of the declared peers (or self URI) already exists in the drive
    let drive
    for(let peer of peers) {
      if (config[peer] && config[peer][route]) {
        drive = config[peer][route]
        break;
      }
    }
    console.log("Found drive?", { drive })
    if (drive) {
      // if the exact path is found among the peers, use that drive path
      await fs.promises.mkdir(drive, { recursive: true }).catch((e) => { })
      return drive
    } else {
      // if the exact path is not found, generate a path in the drive (not generating a new drive, just generating a folder)
      let driveName
      // see if there's an existing peer drive that matches the params.peers
      // if there is, 
      for(let peer of peers) {
        if (config[peer] && Object.keys(config[peer]).length > 0) {
          const r0 = Object.keys(config[peer])[0]
          const relativePath = path.relative(path.resolve(this.home, "drives"), config[peer][r0])
          console.log({ relativePath, r0 })
          driveName = relativePath.split("/")[0]
          break;
        }
      }
      console.log("Generate", { route, driveName })
      drive = await this._generate(route, driveName)
      console.log("generated", { drive })
      return drive
    }
  }

  /*******************************************************************
  *
  *   generates a new folder with a unique name using unix timestamp
  *   await drive.generate()
  *
  *******************************************************************/
  async _generate(relativePath, driveName) {
    console.log("generate", { relativePath, driveName })
    let ts = Date.now()
    if (!driveName) {
      driveName = "d" + ts
    }
    // check if it exists
    let drivePath = path.resolve(this.home, "drives", driveName, relativePath)
    let exists = await fs.promises.access(drivePath).then(() => true).catch(() => false);
    console.log({ exists, drivePath })
    if (exists) {
      while(true) {
        ts++;
        let name = "d" + ts
        drivePath = path.resolve(this.home, "drives", name, relativePath)
        let exists = await fs.promises.access(drivePath).then(() => true).catch(() => false);
        if (!exists) {
          break;
        }
      }
    }
    await fs.promises.mkdir(drivePath, { recursive: true })
    return drivePath
  }
//  async resolve(fullPath) {
//    console.log("resolve", fullPath)
//    let currentPath = fullPath
//    while (true) {
//      try {
//        console.log("trying", currentPath)
//        let gitRemote = await git.getConfig({
//          fs,
//          dir: currentPath,
//          path: 'remote.origin.url'
//        })
//        console.log("gitRemote", gitRemote)
//        const relativePath = path.relative(currentPath, fullPath)
//        return {
//          url: gitRemote,
//          path: relativePath
//        }
//      } catch (e) {
//        console.log("E", e)
//        if (currentPath === path.dirname(currentPath)) {
//          return null
//        } else {
//          currentPath = path.dirname(currentPath)
//        }
//      }
//    }
//  }



}
module.exports = Pdrive
