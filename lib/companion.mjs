import {readFile,mkdir,lstat,chmod,open,rename,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash,randomUUID} from 'node:crypto'
import {bridgeToken,privateDirectory} from './storage.mjs'
import {zipFiles} from './archive.mjs'
const root=fileURLToPath(new URL('../',import.meta.url))
export async function companionFiles({token,port=3055}={}){
  if(!Number.isInteger(port)||port<1024||port>65535)throw new Error('Invalid companion bridge port')
  if(token!==undefined&&!/^[a-f0-9]{64}$/.test(token))throw new Error('Invalid companion pairing token')
  const pkg=JSON.parse(await readFile(join(root,'package.json'),'utf8'))
  const manifest=JSON.parse(await readFile(join(root,'companion/manifest.json'),'utf8'))
  if(token){manifest.id='dsh-to-figma-local-'+createHash('sha256').update(token).digest('hex').slice(0,12);manifest.name='Figmote · Local'}
  manifest.networkAccess.devAllowedDomains=[`http://localhost:${port}`]
  const bootstrap={version:pkg.version,port,...(token?{token}:{})}
  const code=`globalThis.DSH_FIGMA_BOOTSTRAP = ${JSON.stringify(bootstrap)};\n`+await readFile(join(root,'companion/code.js'),'utf8')
  return {
    'manifest.json':JSON.stringify(manifest,null,2)+'\n',
    'code.js':code,
    'ui.html':await readFile(join(root,'companion/ui.html'),'utf8'),
    'README.txt':`Figmote ${pkg.version}\nPrivate paired plugin. Keep this directory on this machine. In Figma Desktop choose Plugins > Development > Import plugin from manifest, open the target file and run Figmote. Keep the plugin running. After an update restart the service and reopen the plugin.\n`,
    'LICENSE':await readFile(join(root,'LICENSE'),'utf8'),
    'FEATHER-LICENSE':await readFile(join(root,'assets/companion/FEATHER-LICENSE'),'utf8'),
  }
}
async function safeDirectory(path){await mkdir(path,{recursive:true,mode:0o700});const stat=await lstat(path);if(!stat.isDirectory()||stat.isSymbolicLink())throw new Error('Companion directory must be a real directory');await chmod(path,0o700)}
async function privateFile(path,value){
  try{const stat=await lstat(path);if(stat.isSymbolicLink()||!stat.isFile())throw new Error('Companion output must be a regular file')}catch(error){if(error.code!=='ENOENT')throw error}
  const temp=path+'.'+randomUUID()+'.tmp'
  try{const file=await open(temp,'wx',0o600);try{await file.writeFile(value);await file.sync()}finally{await file.close()}await rename(temp,path)}finally{await rm(temp,{force:true})}
}
export async function prepareCompanion(home,{port=3055,token}={}){
  const directory=await privateDirectory(home),folder=join(directory,'companion')
  await safeDirectory(folder)
  const files=await companionFiles({port,token:token??await bridgeToken(home)})
  // Publish the manifest last; Figma retains this stable folder across upgrades.
  for(const [name,bytes] of Object.entries(files))if(name!=='manifest.json')await privateFile(join(folder,name),bytes)
  await privateFile(join(folder,'manifest.json'),files['manifest.json'])
  const archive=join(directory,'Figmote-paired.zip');await privateFile(archive,zipFiles(files))
  return {manifest:join(folder,'manifest.json'),folder,archive,paired:true,port,private:true}
}
