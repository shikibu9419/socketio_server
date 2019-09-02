const express = require('express')
// const consola = require('consola')
const { Nuxt, Builder } = require('nuxt')
const app = express()

const host = process.env.HOST || '0.0.0.0'
// const port = process.env.PORT || 3000
const port = 8080

app.set('port', port)

// Import and Set Nuxt.js options
const config = require('../nuxt.config.js')
config.dev = process.env.NODE_ENV !== 'production'

async function start () {
  // Init Nuxt.js
  const nuxt = new Nuxt(config)

  const { host, port } = nuxt.options.server

  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  } else {
    await nuxt.ready()
  }

  // Give nuxt middleware to express
  app.use(nuxt.render)

  // Listen the server
  //   app.listen(port, host)
  //   consola.ready({
  //     message: `Server listening on http://${host}:${port}`,
  //     badge: true
  //   })
  let server = app.listen(port, host)
  console.log('Server listening on http://' + host + ':' + port) // eslint-disable-line no-console

  // WebSocketを起動する
  socketStart(server)
  console.log('Socket.IO starts')
}

let map = {name: 'UNKO', layers: []}
let selected = {}

function socketStart(server) {
  // Websocketサーバーインスタンスを生成する
  const io = require('socket.io').listen(server)

  // クライアントからサーバーに接続があった場合のイベントを作成する
  io.on('connection', socket => {
    // 接続されたクライアントのidをコンソールに表示する
    console.log('id: ' + socket.id + ' is connected')

    // サーバー側で保持しているメッセージをクライアント側に送信する
    socket.emit('init', map)
    console.log('map emitted: ', map.layers[0])

    socket.on('layer/add', layer => {
      console.log('layer/add')
      console.log(layer)

      map.layers.push(layer)
      socket.broadcast.emit('layer/add', layer)
    })

    socket.on('tool/add', prop => {
      console.log('tool/add')
      console.log(prop)

      const tools = map.layers.find(layer => layer.id === prop.layerId).tools
      const toolId = prop.tool.id
      map.layers.find(layer => layer.id === prop.layerId).tools = {...tools, [toolId]: prop.tool}

      socket.broadcast.emit('tool/add', prop)
    })

    socket.on('tool/update', prop => {
      console.log('tool/update')
      console.log(prop)

      socket.broadcast.emit('tool/update', prop)
    })

    socket.on('map/update', prop => {
      console.log('map/update')
      console.log(prop)

      socket.broadcast.emit('map/update', prop)
    })

    socket.on('select/add', prop => {
      console.log('select/add')
      console.log(prop)

      selected[prop.toolId] = prop.userId

      socket.broadcast.emit('select/add', prop)
    })

    socket.on('select/clear', prop => {
      console.log('select/clear')
      console.log(prop)

      hoge(prop.userId)

      socket.broadcast.emit('select/clear', prop)
    })
  })
}

function hoge(userId) {
  for(toolId of Object.keys(selected)) {
    if(selected[toolId] === userId)
      delete selected[toolId]
  }
}

start()
