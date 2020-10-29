const fs = require('fs')
let num = "7"
const input = require('os').homedir() + '/sm64ex/levels/pss/areas/1/' + num + '/model.inc.c'
let inputStr = fs.readFileSync(input, 'utf8')
inputStr = inputStr.replace(/\r/g, "")

let lines = inputStr.split("\n")
lines = lines.filter(line => (line.length != 0) && (line[0] != '/'))

let outputStr = ""

const skipCommands = [
    'gsDPPipeSync',
    'gsDPLoadSync',
    'gsDPTileSync',
    'gsDPSetAlpha',
    "gsSPPerspNormalize",
    'gDPPipeSync',
    'gDPLoadSync',
    'gDPTileSync',
    'gDPSetAlpha',
    "gSPPerspNormalize",
]

while (lines.length > 0) {

    let endSection = lines.indexOf('};')
    if (lines.indexOf(');') != -1 && lines.indexOf(');') < endSection) endSection = lines.indexOf(');')
    let section
    if (lines[1].indexOf('};') != -1) {
        section = lines.splice(0, 2)
    } else {
        section = lines.splice(0, endSection + 1)
    }
    if (section[0].slice(0, 16) == 'static const Vtx') { //vertex
        const vtxArrayName = section[0].slice(17, section[0].indexOf('['))
        outputStr += `const ${vtxArrayName} = [\n`
        section.slice(1, section.length - 1).forEach(line => {
            const items = line.split(',').map(item => parseInt(item.replace(/[{}\s]/g, '')))
            outputStr += `\t{ pos: [ ${items[0]}, ${items[1]}, ${items[2]} ], flag: ${items[3]}, tc: [ ${items[4]}, ${items[5]} ], color: [ ${items[6]}, ${items[7]}, ${items[8]}, ${items[9]} ] },\n`
        })
        outputStr += `]\n\n`
    } else if (section[0].slice(0, 9) == 'const Gfx' || section[0].slice(0, 16) == 'static const Gfx') { //DL
        const dlArrayName = section[0].slice(section[0].indexOf('Gfx') + 4, section[0].indexOf('['))
        outputStr += `export const ${dlArrayName} = [\n`
        section.slice(1, section.length - 1).forEach(line => {
            line = `Gbi.${line.slice(4)}`

            if (skipCommands.includes(line.slice(4, line.indexOf('(')))) return
            if (line.slice(4, 16) == 'gsDPSetCombi') line = `${line.slice(0, line.indexOf(','))}),`
            let idx = line.indexOf("CALC_DXT")
            if (idx != -1) line = `${line.slice(0, idx - 2)}),`
            if (line.slice(4, 12) == 'gsSP2Tri') line = `...${line}`
            outputStr += `\t${line}\n`
        })
        outputStr += `]\n\n`
    } else if (section[0].slice(0, 20) == 'static const Lights1') {
        outputStr += `const ${section[0].slice(21, section[0].length - 16)} Gbi.gdSPDefLights1(\n`
        section.slice(1, section.length - 1).forEach(line => {
            outputStr += `\t${line}\n`
        })
        outputStr += `)\n\n`
    } else if (section[0].slice(0, 24) == 'ALIGNED8 static const u8') {
        const textureName = section[0].slice(25, section[0].length - 6)
        const textureData = section[1].slice(0, section[1].indexOf('}'))
        outputStr += `const ${textureName} = [\n${textureData}\n]\n`
    } else {
        console.log("Could not parse: " + section[0])
    }
}

outputStr = outputStr.replace(/&/g, "")
outputStr = outputStr.replace(/ G_/g, " Gbi.G_")
outputStr = outputStr.replace(/\(G_/g, "(Gbi.G_")
outputStr = outputStr.replace(/\.l/g, ".l[0]")

fs.writeFileSync(__dirname + "/" + num + "model.inc.js", outputStr)
